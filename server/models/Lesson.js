const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema(
    {
        classId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Class",
            required: true
        },

        tutorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Tutor",
            required: true
        },

        title: {
            type: String,
            required: true
        },

        description: {
            type: String,
            default: ""
        },

        date: {
            type: String,
            required: true
        },

        time: {
            type: String,
            required: true
        },

        duration: {
            type: Number,
            default: 60,
            min: 1
        },

        // Stable LiveKit room identifier (Jitsi is no longer used)
        livekitRoom: {
            type: String,
            default: ""
        },
        attendanceSessionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AttendanceSession",
            default: null
        },

        // YouTube recording link added after the lesson
        recordingLink: {
            type: String,
            default: ""
        },

        status: {
            type: String,
            default: "Upcoming"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Lesson", lessonSchema);