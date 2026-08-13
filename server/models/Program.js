const mongoose = require("mongoose");

const programSchema = new mongoose.Schema({

    // =========================================
    // TUITION CENTRE NAME
    // =========================================

    name: {
        type: String,
        required: true,
        unique: true
    },


    // =========================================
    // OWNER OF THE TUITION CENTRE
    // =========================================

    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tutor",
        required: true
    },


    // =========================================
    // BASIC INFORMATION
    // =========================================

    location: {
        type: String,
        default: ""
    },

    description: {
        type: String,
        default: ""
    },


    // =========================================
    // BANK DETAILS
    // =========================================

    bankName: {
        type: String,
        default: ""
    },

    accountHolder: {
        type: String,
        default: ""
    },

    accountNumber: {
        type: String,
        default: ""
    },

    branchCode: {
        type: String,
        default: ""
    },


    // =========================================
    // MONTHLY TUITION CENTRE FEE
    // =========================================

    monthlyFee: {
        type: Number,
        default: 0
    },


    // =========================================
    // TUTORHUB PAYMENT PROOF
    // =========================================

    paymentProof: {
        type: String,
        default: ""
    },


    // =========================================
    // TUTORHUB ADMIN APPROVAL / ACCESS
    // =========================================

    status: {
        type: String,
        enum: [
            "Pending",
            "Active",
            "Blocked"
        ],
        default: "Pending"
    },


    // =========================================
    // TUTORHUB SUBSCRIPTION
    // =========================================

    subscriptionStatus: {
        type: String,
        enum: [
            "Pending",
            "Paid",
            "Blocked"
        ],
        default: "Pending"
    },


    subscriptionDueDate: {
        type: Date,
        default: null
    }

}, {
    timestamps: true
});


module.exports = mongoose.model(
    "Program",
    programSchema
);