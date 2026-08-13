const mongoose = require("mongoose");

const ownerPaymentSchema = new mongoose.Schema({

    // =========================================
    // TUITION CENTRE OWNER
    // =========================================

    ownerId: {

        type: mongoose.Schema.Types.ObjectId,

        ref: "Tutor",

        required: true

    },


    // =========================================
    // TUITION CENTRE
    // =========================================

    programId: {

        type: mongoose.Schema.Types.ObjectId,

        ref: "Program",

        required: true

    },


    // =========================================
    // PAYMENT MONTH
    // =========================================

    month: {

        type: String,

        required: true

    },


    // =========================================
    // PAYMENT YEAR
    // =========================================

    year: {

        type: Number,

        required: true

    },


    // =========================================
    // AMOUNT PAID
    // =========================================

    amount: {

        type: Number,

        required: true

    },


    // =========================================
    // PAYMENT PROOF
    // =========================================

    proof: {

        type: String,

        default: ""

    },


    // =========================================
    // PAYMENT STATUS
    // =========================================

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

    timestamps: true

});


module.exports = mongoose.model(
    "OwnerPayment",
    ownerPaymentSchema
);