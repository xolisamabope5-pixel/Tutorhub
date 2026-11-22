const mongoose = require("mongoose");


const learnerSchema = new mongoose.Schema({



    name: {

        type: String,

        required: true

    },



    surname: {

        type: String,

        required: true

    },



    grade: {

        type: String,

        required: true

    },



    // Retained for existing accounts; optional for new registrations.
    school: { type: String, default: "" },



    // Subjects are selected from the provider's available options later.
    subjects: { type: String, default: "" },

    email: { type: String, lowercase: true, trim: true, sparse: true },

    providerType: { type: String, enum: ["tuition-centre", "private-tutor"], default: "tuition-centre" },

    tuitionOption: { type: String, default: "" },




    // Username remains for backward compatibility with existing accounts.
    username: { type: String, default: undefined, sparse: true },



    password: {

        type: String,

        required: true

    },




    // Payment proof uploaded during registration

    paymentProof: { type: String, default: "" },





    // Tuition centre learner belongs to

    programId: {

        type: mongoose.Schema.Types.ObjectId,

        ref: "Program",

        required: false,

        default: null

    },





    // Tutor responsible for learner

    tutorId: {

        type: mongoose.Schema.Types.ObjectId,

        ref: "Tutor",

        required: false,

        default: null

    },






    // Owner approval status

    status: {

        type: String,

        enum: [

            "Pending",

            "Approved",

            "Rejected"

        ],

        default: "Pending"

    },






    // Monthly payment tracking

    paymentStatus: {

        type: String,

        enum: [

            "Pending",

            "Paid",

            "Overdue"

        ],

        default: "Pending"

    },







    // Access control

    accountStatus: {

        type: String,

        enum: [

            "Active",

            "Blocked"

        ],

        default: "Active"

    }



}, {


    timestamps:true


});





// New email-based accounts are unique; legacy accounts without email remain valid.
learnerSchema.index({ email: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model(

    "Learner",

    learnerSchema

);