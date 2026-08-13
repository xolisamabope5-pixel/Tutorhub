const mongoose = require("mongoose");


const paymentSchema = new mongoose.Schema({


    // Learner who made the payment

    learnerId: {

        type: mongoose.Schema.Types.ObjectId,

        ref: "Learner",

        required: true

    },



    // Tuition centre

    programId: {

        type: mongoose.Schema.Types.ObjectId,

        ref: "Program",

        required: true

    },



    // Payment month

    month: {

        type: String,

        required: true

    },



    // Payment year

    year: {

        type: Number,

        required: true

    },



    // Amount paid

    amount: {

        type: Number,

        required: true

    },



    // Uploaded proof of payment

    proof: {

        type: String,

        default: ""

    },



    // Payment approval

    status: {

        type: String,

        enum: [

            "Pending",

            "Paid",

            "Rejected"

        ],

        default: "Pending"

    }



}, {


    timestamps:true


});



module.exports = mongoose.model(

    "Payment",

    paymentSchema

);