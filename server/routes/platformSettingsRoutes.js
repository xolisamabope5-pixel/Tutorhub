const express = require("express");

const router = express.Router();

const PlatformSettings =
    require("../models/PlatformSettings");


// =====================================================
// GET PLATFORM SETTINGS
// Used by Admin
// =====================================================

router.get("/", async (req, res) => {

    try {

        let settings =
            await PlatformSettings.findOne();

        // Create default settings if none exist
        if (!settings) {

            settings =
                await PlatformSettings.create({});

        }

        res.json(settings);

    } catch (error) {

        console.log(
            "GET PLATFORM SETTINGS ERROR:",
            error
        );

        res.status(500).json({

            message:
                "Could not load platform settings"

        });

    }

});


// =====================================================
// UPDATE PLATFORM SETTINGS
// Used by Admin
// =====================================================

router.put("/", async (req, res) => {

    try {

        let settings =
            await PlatformSettings.findOne();

        if (!settings) {

            settings =
                new PlatformSettings();

        }


        // =============================================
        // PLATFORM SETTINGS
        // =============================================

        settings.platformName =
            req.body.platformName ??
            settings.platformName;

        settings.tagline =
            req.body.tagline ??
            settings.tagline;

        settings.primaryColor =
            req.body.primaryColor ??
            settings.primaryColor;

        settings.secondaryColor =
            req.body.secondaryColor ??
            settings.secondaryColor;

        settings.currency =
            req.body.currency ??
            settings.currency;

        settings.monthlySubscription =
            req.body.monthlySubscription ??
            settings.monthlySubscription;


        // =============================================
        // TUTORHUB BANK DETAILS
        // =============================================

        settings.tutorhubBankName =
            req.body.tutorhubBankName ??
            settings.tutorhubBankName;

        settings.tutorhubAccountHolder =
            req.body.tutorhubAccountHolder ??
            settings.tutorhubAccountHolder;

        settings.tutorhubAccountNumber =
            req.body.tutorhubAccountNumber ??
            settings.tutorhubAccountNumber;

        settings.tutorhubBranchCode =
            req.body.tutorhubBranchCode ??
            settings.tutorhubBranchCode;

        settings.tutorhubAccountType =
            req.body.tutorhubAccountType ??
            settings.tutorhubAccountType;


        await settings.save();


        res.json(settings);

    } catch (error) {

        console.log(
            "UPDATE PLATFORM SETTINGS ERROR:",
            error
        );

        res.status(500).json({

            message:
                "Could not update platform settings"

        });

    }

});


// =====================================================
// GET TUTORHUB PAYMENT DETAILS
// Used by Tuition Owner Registration
// =====================================================

router.get(
    "/owner-payment-details",
    async (req, res) => {

        try {

            const settings =
                await PlatformSettings.findOne();

            if (!settings) {

                return res.status(404).json({

                    message:
                        "TutorHub payment details not configured"

                });

            }


            res.json({

                tutorhubBankName:
                    settings.tutorhubBankName,

                tutorhubAccountHolder:
                    settings.tutorhubAccountHolder,

                tutorhubAccountNumber:
                    settings.tutorhubAccountNumber,

                tutorhubBranchCode:
                    settings.tutorhubBranchCode,

                tutorhubAccountType:
                    settings.tutorhubAccountType,

                monthlySubscription:
                    settings.monthlySubscription,

                currency:
                    settings.currency

            });

        } catch (error) {

            console.log(
                "OWNER PAYMENT DETAILS ERROR:",
                error
            );

            res.status(500).json({

                message:
                    "Could not load TutorHub payment details"

            });

        }

    }
);


module.exports = router;