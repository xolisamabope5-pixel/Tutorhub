const mongoose = require("mongoose");

const platformSettingsSchema = new mongoose.Schema(
    {
        platformName: {
            type: String,
            default: "TutorHub"
        },

        tagline: {
            type: String,
            default: "Smart Tuition Management Platform"
        },

        primaryColor: {
            type: String,
            default: "#111827"
        },

        secondaryColor: {
            type: String,
            default: "#eef2ff"
        },

        currency: {
            type: String,
            default: "ZAR"
        },

        monthlySubscription: {
            type: Number,
            default: 499
        },

        // =========================================
        // TUTORHUB BANK DETAILS
        // =========================================

        tutorhubBankName: {
            type: String,
            default: ""
        },

        tutorhubAccountHolder: {
            type: String,
            default: ""
        },

        tutorhubAccountNumber: {
            type: String,
            default: ""
        },

        tutorhubBranchCode: {
            type: String,
            default: ""
        },

        tutorhubAccountType: {
            type: String,
            default: ""
        },

        // =========================================
        // PAYMENT PROOF
        // =========================================

        tutorhubPaymentProof: {
            type: String,
            default: ""
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model(
    "PlatformSettings",
    platformSettingsSchema
);