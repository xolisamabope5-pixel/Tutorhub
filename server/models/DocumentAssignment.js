const mongoose = require("mongoose");

const documentAssignmentSchema = new mongoose.Schema({

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

    document: {
        type: String,
        required: true
    },

    documentName: {
        type: String,
        default: ""
    },

    totalMarks: {
        type: Number,
        required: true
    },

    dueDate: {
        type: Date,
        required: true
    }

}, {
    timestamps: true
});

module.exports = mongoose.model(
    "DocumentAssignment",
    documentAssignmentSchema
);