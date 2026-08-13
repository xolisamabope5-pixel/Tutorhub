
const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema({

    assignmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Assignment",
        required: true
    },

    learnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Learner",
        required: true
    },

    answers: [
        {
            questionId: {
                type: mongoose.Schema.Types.ObjectId,
                required: true
            },

            answer: {
                type: String,
                default: ""
            },

            marks: {
                type: Number,
                default: null
            },

            correct: {
                type: Boolean,
                default: null
            }
        }
    ],

    file: {
        type: String,
        default: null
    },

    mark: {
        type: Number,
        default: null
    },

    feedback: {
        type: String,
        default: ""
    },

    status: {
        type: String,
        default: "Submitted"
    }

}, {
    timestamps: true
});

module.exports = mongoose.model(
    "Submission",
    submissionSchema
);

