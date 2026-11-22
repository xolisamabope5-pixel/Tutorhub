const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { authenticate } = require("../middleware/authMiddleware");
const Class = require("../models/Class");
const Tutor = require("../models/Tutor");
const Learner = require("../models/learner");
const Program = require("../models/Program");
const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const Material = require("../models/Material");
const Lesson = require("../models/Lesson");
const Conversation = require("../models/Conversation");
const NotificationState = require("../models/NotificationState");

router.use(authenticate);
const validId = value => mongoose.isValidObjectId(value);
const add = (list, item) => { if (item && item.createdAt) list.push(item); };

router.get("/", async (req, res) => {
  try {
    const { id, role } = req.user;
    if (!validId(id)) return res.status(401).json({ message: "Invalid account session" });
    const userId = new mongoose.Types.ObjectId(id);
    const state = await NotificationState.findOne({ userId, role }).lean();
    const lastSeenAt = state?.lastSeenAt || new Date(0);
    let classes = [];
    let learner = null;

    if (role === "learner") {
      learner = await Learner.findById(userId).select("programId tutorId").lean();
      classes = await Class.find({ learners: userId }).select("className grade subject announcements materials").lean();
    } else if (["teacher", "owner"].includes(role)) {
      const tutor = await Tutor.findById(userId).select("programId role").lean();
      if (tutor) {
        const classFilter = role === "owner" && tutor.programId
          ? { $or: [{ programId: tutor.programId }, { tutorId: userId }] }
          : { tutorId: userId };
        classes = await Class.find(classFilter).select("className grade subject announcements materials").lean();
      }
    }

    const classIds = classes.map(c => c._id);
    const className = new Map(classes.map(c => [String(c._id), `${c.grade || "Class"} ${c.className || ""} · ${c.subject || ""}`.trim()]));
    const events = [];
    const since = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000);

    for (const cls of classes) {
      for (const a of (cls.announcements || [])) add(events, {
        id: `announcement-${cls._id}-${a._id || a.createdAt}`, type: "announcement", title: a.title || "New announcement",
        body: a.message || "A class announcement was posted.", createdAt: a.createdAt, path: role === "learner" ? "/learner/announcements" : `/tutor-classroom/${cls._id}`, className: className.get(String(cls._id))
      });
      for (const m of (cls.materials || [])) add(events, {
        id: `material-${cls._id}-${m._id || m.createdAt}`, type: "material", title: m.title || "New learning material",
        body: m.description || "New material is available.", createdAt: m.createdAt, path: role === "learner" ? "/learner/classes" : `/tutor-classroom/${cls._id}`, className: className.get(String(cls._id))
      });
    }

    if (classIds.length) {
      if (role === "learner") {
        const [assignments, materials, lessons] = await Promise.all([
          Assignment.find({ classId: { $in: classIds }, createdAt: { $gte: since } }).select("title description createdAt classId").lean(),
          Material.find({ classId: { $in: classIds }, createdAt: { $gte: since } }).select("title description createdAt classId").lean(),
          Lesson.find({ classId: { $in: classIds }, createdAt: { $gte: since } }).select("title date time createdAt classId").lean()
        ]);
        assignments.forEach(a => add(events, { id: `assignment-${a._id}`, type: "assignment", title: `New assignment: ${a.title}`, body: a.description || "A new assignment is ready.", createdAt: a.createdAt, path: "/learner/assignments", className: className.get(String(a.classId)) }));
        materials.forEach(m => add(events, { id: `material-file-${m._id}`, type: "material", title: `New material: ${m.title}`, body: m.description || "New learning material is available.", createdAt: m.createdAt, path: "/learner/classes", className: className.get(String(m.classId)) }));
        lessons.forEach(l => add(events, { id: `lesson-${l._id}`, type: "lesson", title: `Lesson updated: ${l.title}`, body: `${l.date || "Scheduled lesson"} ${l.time || ""}`.trim(), createdAt: l.createdAt, path: "/learner/lessons", className: className.get(String(l.classId)) }));
        const released = await Submission.find({ learnerId: userId, resultVisible: true, $or: [{ resultVisibleAt: { $gte: since } }, { resultVisibleAt: null, updatedAt: { $gte: since } }] }).populate("assignmentId", "title").select("mark feedback updatedAt resultVisibleAt assignmentId").lean();
        released.forEach(s => add(events, { id: `result-${s._id}`, type: "result", title: `Marks released: ${s.assignmentId?.title || "Assignment"}`, body: s.mark == null ? "Your marked work is ready to view." : `Your mark: ${s.mark}`, createdAt: s.resultVisibleAt || s.updatedAt, path: "/learner/results" }));
      } else {
        const assignments = await Assignment.find({ classId: { $in: classIds } }).select("_id title").lean();
        const assignmentIds = assignments.map(a => a._id);
        const submissions = assignmentIds.length ? await Submission.find({ assignmentId: { $in: assignmentIds }, status: "Submitted", updatedAt: { $gte: since } }).populate("assignmentId", "title classId").populate("learnerId", "name surname").select("updatedAt assignmentId learnerId").lean() : [];
        submissions.forEach(s => add(events, { id: `submission-${s._id}`, type: "submission", title: `New submission: ${s.assignmentId?.title || "Assignment"}`, body: `${s.learnerId?.name || "A learner"} ${s.learnerId?.surname || ""} submitted work.`, createdAt: s.updatedAt, path: "/inbox", className: className.get(String(s.assignmentId?.classId || "")) }));
        const [lessons, newAssignments] = await Promise.all([
          Lesson.find({ classId: { $in: classIds }, createdAt: { $gte: since } }).select("title date time createdAt classId").lean(),
          Assignment.find({ classId: { $in: classIds }, createdAt: { $gte: since } }).select("title createdAt classId").lean()
        ]);
        lessons.forEach(l => add(events, { id: `lesson-${l._id}`, type: "lesson", title: `Lesson created: ${l.title}`, body: `${l.date || ""} ${l.time || ""}`.trim(), createdAt: l.createdAt, path: `/tutor-classroom/${l.classId}`, className: className.get(String(l.classId)) }));
        newAssignments.forEach(a => add(events, { id: `assignment-${a._id}`, type: "assignment", title: `Assignment created: ${a.title}`, body: "Your class assignment is available.", createdAt: a.createdAt, path: `/tutor-classroom/${a.classId}`, className: className.get(String(a.classId)) }));
      }
    }

    const conversations = await Conversation.find({ "participants.userId": userId }).select("_id messages participants").lean();
    for (const conversation of conversations) {
      const other = (conversation.participants || []).find(p => String(p.userId) !== String(userId));
      const unread = (conversation.messages || []).filter(m => String(m.senderId) !== String(userId) && !(m.readBy || []).some(x => String(x) === String(userId))).slice(-3);
      unread.forEach(m => add(events, { id: `message-${conversation._id}-${m._id}`, type: "message", title: "New message", body: m.body || m.attachmentName || "You received an attachment.", createdAt: m.createdAt, path: `/inbox?conversation=${conversation._id}`, senderRole: other?.role }));
    }

    const unique = [...new Map(events.filter(e => new Date(e.createdAt) >= since).map(e => [e.id, e])).values()]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 40)
      .map(e => ({ ...e, isRead: new Date(e.createdAt) <= new Date(lastSeenAt) }));
    res.json({ notifications: unique, unreadCount: unique.filter(e => !e.isRead).length, lastSeenAt });
  } catch (error) {
    console.error("Notification feed error:", error);
    res.status(500).json({ message: "Could not load notifications" });
  }
});

router.patch("/read", async (req, res) => {
  try {
    const { id, role } = req.user;
    if (!validId(id)) return res.status(401).json({ message: "Invalid account session" });
    const state = await NotificationState.findOneAndUpdate(
      { userId: id, role }, { $set: { lastSeenAt: new Date() } }, { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json({ success: true, lastSeenAt: state.lastSeenAt });
  } catch (error) {
    res.status(500).json({ message: "Could not mark notifications as read" });
  }
});

module.exports = router;
