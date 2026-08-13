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

        // Automatically generated Jitsi room
        jitsiRoom: {
            type: String,
            required: true
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