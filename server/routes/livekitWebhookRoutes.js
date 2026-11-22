const express = require("express");
const { WebhookReceiver } = require("livekit-server-sdk");
const router = express.Router();
const Lesson = require("../models/Lesson");
const AttendanceSession = require("../models/AttendanceSession");
const Class = require("../models/Class");

function updateLearnerEntry(session, learnerId, joining) {
  let entry = session.entries.find(item => String(item.learnerId) === String(learnerId));
  if (joining) {
    if (!entry) session.entries.push({ learnerId, periods: [{ joinedAt: new Date() }] });
    else {
      const last = entry.periods[entry.periods.length - 1];
      if (!last || last.leftAt) entry.periods.push({ joinedAt: new Date() });
    }
    return;
  }
  if (!entry) return;
  const now = new Date();
  const last = entry.periods[entry.periods.length - 1];
  if (last && !last.leftAt) last.leftAt = now;
  entry.totalSeconds = (entry.periods || []).reduce((sum, period) => sum + Math.max(0, ((period.leftAt || now) - period.joinedAt) / 1000), 0);
  const expectedSeconds = Math.max(60, Number(session.scheduledDurationMinutes || 60) * 60);
  const thresholdSeconds = expectedSeconds * (Number(session.thresholdPercent || 75) / 100);
  const firstJoin = entry.periods[0]?.joinedAt;
  entry.status = entry.manualStatus || (entry.totalSeconds >= thresholdSeconds
    ? (firstJoin && new Date(firstJoin).getTime() - new Date(session.scheduledStart).getTime() > 5 * 60000 ? "Late" : "Present")
    : entry.totalSeconds > 0 ? (entry.totalSeconds < expectedSeconds * 0.5 ? "Left early" : "Partial") : "Absent");
}

function getScheduledStart(lesson) {
  try {
    // TutorHub schedules are entered in South African local time (UTC+02:00).
    const value = new Date(`${lesson.date}T${lesson.time}:00+02:00`);
    return Number.isNaN(value.getTime()) ? new Date() : value;
  } catch { return new Date(); }
}

async function createAttendanceSession(lesson) {
  const classroom = await Class.findById(lesson.classId).select("learners").lean();
  const enrolledLearners = (classroom?.learners || []).map(learnerId => ({
    learnerId, periods: [], totalSeconds: 0, status: "Absent"
  }));
  const session = await AttendanceSession.create({
    classId: lesson.classId,
    tutorId: lesson.tutorId,
    title: lesson.title,
    scheduledStart: getScheduledStart(lesson),
    scheduledDurationMinutes: lesson.duration || 60,
    thresholdPercent: 75,
    status: "Live",
    startedAt: new Date(),
    entries: enrolledLearners
  });
  lesson.attendanceSessionId = session._id;
  return session;
}

// LiveKit requires the original raw body to verify the webhook signature.
router.post("/webhook", express.raw({ type: "application/webhook+json" }), async (req, res) => {
  try {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    if (!apiKey || !apiSecret) return res.status(503).json({ message: "LiveKit webhook is not configured." });
    if (!Buffer.isBuffer(req.body)) return res.status(400).json({ message: "Expected raw LiveKit webhook payload." });
    const receiver = new WebhookReceiver(apiKey, apiSecret);
    const event = await receiver.receive(req.body.toString("utf8"), req.get("Authorization"));
    if (!["participant_joined", "participant_left", "room_finished"].includes(event.event)) return res.status(200).json({ received: true });

    const roomName = event.room?.name;
    if (!roomName) return res.status(400).json({ message: "Webhook is missing room information." });
    const lesson = await Lesson.findOne({ livekitRoom: roomName });
    if (!lesson) return res.status(200).json({ received: true, ignored: "unknown-room" });

    // Do not end a lesson just because the tutor briefly disconnects. LiveKit may
    // reconnect that participant; only room_finished closes the attendance session.
    if (event.event === "room_finished") {
      if (lesson.attendanceSessionId) {
        const session = await AttendanceSession.findById(lesson.attendanceSessionId);
        if (session?.status === "Live") {
          const now = new Date();
          for (const entry of session.entries) updateLearnerEntry(session, entry.learnerId, false);
          session.status = "Ended";
          session.endedAt = now;
          lesson.status = "Completed";
          await Promise.all([session.save(), lesson.save()]);
        }
      } else {
        lesson.status = "Completed";
        await lesson.save();
      }
      return res.status(200).json({ received: true, closed: true });
    }

    const participant = event.participant;
    if (!participant?.identity) return res.status(400).json({ message: "Webhook is missing participant identity." });
    const participantRole = participant.attributes?.role || "";

    if (event.event === "participant_joined") {
      if (participantRole === "tutor") {
        let session = lesson.attendanceSessionId ? await AttendanceSession.findById(lesson.attendanceSessionId) : null;
        if (!session || session.status !== "Live") session = await createAttendanceSession(lesson);
        lesson.status = "Live";
        await lesson.save();
      } else if (participantRole === "learner" && lesson.status === "Live") {
        // A learner can arrive milliseconds before the tutor's participant_joined
        // webhook. Create the session if needed, then record this first join rather
        // than leaving an already-present learner incorrectly marked Absent.
        let session = lesson.attendanceSessionId ? await AttendanceSession.findById(lesson.attendanceSessionId) : null;
        if (!session || session.status !== "Live") {
          session = await createAttendanceSession(lesson);
          await lesson.save();
        }
        updateLearnerEntry(session, participant.identity, true);
        await session.save();
      }
    } else if (event.event === "participant_left" && lesson.attendanceSessionId) {
      const session = await AttendanceSession.findById(lesson.attendanceSessionId);
      if (session?.status === "Live") {
        if (participantRole === "tutor") {
          // Keep the session live during a tutor reconnect. room_finished is the
          // authoritative signal that the room has actually ended.
        } else if (participantRole === "learner") {
          updateLearnerEntry(session, participant.identity, false);
          await session.save();
        }
      }
    }
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("LiveKit webhook verification/processing failed:", error);
    return res.status(401).json({ message: "Invalid LiveKit webhook." });
  }
});

module.exports = router;
