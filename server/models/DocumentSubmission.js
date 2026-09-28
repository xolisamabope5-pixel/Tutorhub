const mongoose = require("mongoose");

const documentSubmissionSchema = new mongoose.Schema({

    assignmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DocumentAssignment",
        required: true
    },

    learnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Learner",
        required: true
    },

    files: [
        {
            url: {
                type: String,
                required: true
            },

            name: {
                type: String,
                default: ""
            }
        }
    ],

    mark: {
        type: Number,
        default: null
    },

    feedback: {
        type: String,
        default: ""
    },

    markedDocument: {
        type: String,
        default: null
    },

    status: {
        type: String,
        default: "Submitted"
    }

}, {
    timestamps: true
});

module.exports = mongoose.model(
    "DocumentSubmission",
    documentSubmissionSchema
);