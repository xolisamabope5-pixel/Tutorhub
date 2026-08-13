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



    school: {

        type: String,

        required: true

    },



    subjects: {

        type: String,

        required: true

    },




    username: {

        type: String,

        required: true,

        unique: true

    },



    password: {

        type: String,

        required: true

    },




    // Payment proof uploaded during registration

    paymentProof: {

        type: String,

        required: true

    },





    // Tuition centre learner belongs to

    programId: {

        type: mongoose.Schema.Types.ObjectId,

        ref: "Program",

        required: true

    },





    // Tutor responsible for learner

    tutorId: {

        type: mongoose.Schema.Types.ObjectId,

        ref: "Tutor",

        required: true

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





module.exports = mongoose.model(

    "Learner",

    learnerSchema

);