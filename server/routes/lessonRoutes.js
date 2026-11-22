const express = require("express");
const crypto = require("crypto");
const { AccessToken } = require("livekit-server-sdk");
const router = express.Router();

const Lesson = require("../models/Lesson");
const Class = require("../models/Class");
const { authenticate, authorizeRoles } = require("../middleware/authMiddleware");
const requireTutor = [authenticate, authorizeRoles("teacher", "owner", "admin")];
async function ownsClass(user, classId) {
    const classroom = await Class.findById(classId).select("tutorId learners");
    if (!classroom) return null;
    if (user.role === "admin" || (["teacher", "owner"].includes(user.role) && String(classroom.tutorId) === String(user.id))) return classroom;
    return false;
}


// ==========================================
// CREATE A LESSON
// ==========================================

router.post("/create", ...requireTutor, async (req, res) => {

    try {

        const {
            classId,
            title,
            description,
            date,
            time,
            duration
        } = req.body;


        const classroom = await ownsClass(req.user, classId);
        if (!classroom) return res.status(404).json({ message: "Classroom not found or you do not own it." });
        const tutorId = req.user.id;

        // Generate a unique meeting room name
        const roomName =
            "tutorhub-" +
            crypto.randomBytes(18).toString("hex");


        const lesson = new Lesson({

            classId,

            tutorId,

            title,

            description,

            date,

            time,

            duration: Number(duration) > 0 ? Number(duration) : 60,

            // LiveKit room is created when the tutor starts the lesson
            livekitRoom: roomName,

            status: "Upcoming"

        });


        await lesson.save();


        res.status(201).json({

            message: "Lesson created successfully",

            lesson

        });


    } catch (error) {

        console.error("Create lesson error:", error);

        res.status(500).json({

            message: "Failed to create lesson",

            error: error.message

        });

    }

});


// ==========================================
// GET LESSONS FOR A CLASS
// ==========================================

router.get("/class/:classId", authenticate, async (req, res) => {

    try {

        const classroom = await Class.findById(req.params.classId).select("tutorId learners");
        if (!classroom) return res.status(404).json({ message: "Classroom not found." });
        const isTutor = ["teacher", "owner"].includes(req.user.role) && String(classroom.tutorId) === String(req.user.id);
        const isLearner = req.user.role === "learner" && (classroom.learners || []).some(id => String(id) === String(req.user.id));
        if (!(req.user.role === "admin" || isTutor || isLearner)) return res.status(403).json({ message: "You are not allowed to view this classroom's lessons." });
        const lessons = await Lesson.find({ classId: req.params.classId })
            .populate("tutorId", "name surname")
            .sort({ date: 1, time: 1 });
        res.json(lessons);


    } catch (error) {

        console.error("Get lessons error:", error);

        res.status(500).json({

            message: "Failed to get lessons",

            error: error.message

        });

    }

});


// ==========================================
// TUTOR STARTS A LIVE LESSON
// ==========================================
router.post("/:id/start-live", ...requireTutor, async (req, res) => {
    try {
        const lesson = await Lesson.findById(req.params.id);
        if (!lesson) return res.status(404).json({ message: "Lesson not found." });
        const classroom = await Class.findById(lesson.classId).select("tutorId");
        if (!classroom) return res.status(404).json({ message: "Classroom not found." });
        const isOwner = req.user.role === "admin" || ( ["teacher", "owner"].includes(req.user.role) && String(classroom.tutorId) === String(req.user.id));
        if (!isOwner) return res.status(403).json({ message: "You are not allowed to start this lesson." });
        if (!process.env.LIVEKIT_URL || !process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) {
            return res.status(503).json({ message: "Live lessons are not configured yet. Add the LiveKit Cloud settings to the server environment." });
        }
        if (!lesson.livekitRoom) lesson.livekitRoom = `tutorhub-${crypto.randomBytes(16).toString("hex")}`;
        lesson.status = "Live";
        await lesson.save();
        return res.json({ message: "Live lesson started.", lesson });
    } catch (error) {
        console.error("Start live lesson error:", error);
        return res.status(500).json({ message: "Could not start the live lesson." });
    }
});

// ==========================================
// LIVEKIT TOKEN + AUTOMATIC ATTENDANCE
// ==========================================
router.post("/:id/livekit-token", authenticate, async (req, res) => {
    try {
        const lesson = await Lesson.findById(req.params.id);
        if (!lesson) return res.status(404).json({ message: "Lesson not found." });
        const classroom = await Class.findById(lesson.classId).select("tutorId learners className");
        if (!classroom) return res.status(404).json({ message: "Classroom not found." });
        const isProvider = req.user.role === "admin" || (["teacher", "owner"].includes(req.user.role) && String(classroom.tutorId) === String(req.user.id));
        const isLearner = req.user.role === "learner" && (classroom.learners || []).some(id => String(id) === String(req.user.id));
        if (!isProvider && !isLearner) return res.status(403).json({ message: "You are not allowed to join this lesson." });
        if (isLearner && lesson.status !== "Live") return res.status(409).json({ message: "The tutor has not started this live lesson yet." });
        const apiKey = process.env.LIVEKIT_API_KEY;
        const apiSecret = process.env.LIVEKIT_API_SECRET;
        const livekitUrl = process.env.LIVEKIT_URL;
        if (!apiKey || !apiSecret || !livekitUrl) return res.status(503).json({ message: "Live lessons are not configured yet. Add LIVEKIT_URL, LIVEKIT_API_KEY and LIVEKIT_API_SECRET to the server environment." });
        if (!lesson.livekitRoom) { lesson.livekitRoom = `tutorhub-${crypto.randomBytes(16).toString("hex")}`; }
        await lesson.save();
        const identity = String(req.user.id);
        const displayName = String(req.user.name || req.user.email || (isProvider ? "Tutor" : "Learner")).slice(0, 80);
        const token = new AccessToken(apiKey, apiSecret, { identity, name: displayName, attributes: { role: isProvider ? "tutor" : "learner" }, ttl: "4h" });
        token.addGrant({ roomJoin: true, room: lesson.livekitRoom, canPublish: true, canSubscribe: true, canPublishData: true });
        res.json({ token: await token.toJwt(), serverUrl: livekitUrl, roomName: lesson.livekitRoom, role: isProvider ? "tutor" : "learner", attendanceSessionId: lesson.attendanceSessionId || null, lesson: { id: lesson._id, title: lesson.title } });
    } catch (error) { console.error("LiveKit token error:", error); res.status(500).json({ message: "Could not prepare the live lesson." }); }
});

// ==========================================
// ADD / UPDATE YOUTUBE RECORDING
// ==========================================

router.put("/:id/recording", ...requireTutor, async (req, res) => {

    try {

        const { recordingLink } = req.body;
        const lesson = await Lesson.findById(req.params.id);
        if (!lesson) return res.status(404).json({ message: "Lesson not found" });
        if (req.user.role !== "admin" && String(lesson.tutorId) !== String(req.user.id)) return res.status(403).json({ message: "You do not own this lesson." });
        if (typeof recordingLink !== "string" || !/^https?:\/\//i.test(recordingLink.trim())) return res.status(400).json({ message: "Enter a valid recording URL." });
        lesson.recordingLink = recordingLink.trim();
        lesson.status = "Completed";
        await lesson.save();


        if (!lesson) {

            return res.status(404).json({

                message: "Lesson not found"

            });

        }


        res.json({

            message: "Recording added successfully",

            lesson

        });


    } catch (error) {

        console.error("Add recording error:", error);

        res.status(500).json({

            message: "Failed to add recording",

            error: error.message

        });

    }

});
// ==========================================
// DELETE LESSON
// ==========================================

router.delete("/:id", ...requireTutor, async (req, res) => {

    try {

        const lesson = await Lesson.findById(req.params.id);
        if (lesson && req.user.role !== "admin" && String(lesson.tutorId) !== String(req.user.id)) return res.status(403).json({ message: "You do not own this lesson." });
        if (lesson) await Lesson.findByIdAndDelete(req.params.id);

        if (!lesson) {

            return res.status(404).json({

                message: "Lesson not found"

            });

        }

        res.json({

            message: "Lesson deleted successfully"

        });

    } catch (error) {

        console.error("Delete lesson error:", error);

        res.status(500).json({

            message: "Failed to delete lesson",

            error: error.message

        });

    }

});

module.exports = router;