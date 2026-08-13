const express = require("express");
const router = express.Router();
const Admin = require("../models/Admin");
const bcrypt = require("bcryptjs");
const PlatformSettings = require("../models/PlatformSettings");
const Tutor = require("../models/Tutor");
const Learner = require("../models/Learner");
const Program = require("../models/Program");


// =====================================================
// GET ALL TUITION CENTRES
// =====================================================
// Admin sees:
// - Centre information
// - Owner information
// - Payment proof
// - Subscription information
// - Number of learners
// - Number of tutors
//
// Admin DOES NOT receive learner/tutor details.
// =====================================================

router.get("/programs", async (req, res) => {

    try {

        const programs = await Program.find()
            .populate(
                "ownerId",
                "name surname email"
            )
            .lean();


        const programsWithStats = await Promise.all(

            programs.map(async (program) => {

                const learnerCount = await Learner.countDocuments({
                    programId: program._id
                });


                const tutorCount = await Tutor.countDocuments({
                    programId: program._id,
                    role: "teacher"
                });


                return {

                    _id: program._id,

                    name: program.name,

                    location: program.location,

                    description: program.description,

                    owner: program.ownerId
                        ? {
                            name: program.ownerId.name,
                            surname: program.ownerId.surname,
                            email: program.ownerId.email
                        }
                        : null,

                    paymentProof: program.paymentProof,

                    monthlyFee: program.monthlyFee,

                    subscriptionStatus:
                        program.subscriptionStatus,

                    subscriptionDueDate:
                        program.subscriptionDueDate,

                    status:
                        program.status,

                    learnerCount,

                    tutorCount,

                    createdAt:
                        program.createdAt

                };

            })

        );


        res.json(programsWithStats);


    } catch (error) {

        console.log(error);

        res.status(500).json({

            message:
                "Could not fetch tuition centres"

        });

    }

});


// =====================================================
// APPROVE TUITION CENTRE
// =====================================================

router.put("/approve-program/:id", async (req, res) => {

    try {

        const program =
            await Program.findByIdAndUpdate(

                req.params.id,

                {
                    status: "Active",
                    subscriptionStatus: "Paid"
                },

                {
                    new: true
                }

            );


        if (!program) {

            return res.status(404).json({

                message:
                    "Tuition centre not found"

            });

        }


        // Approve the owner as well

        await Tutor.findByIdAndUpdate(

            program.ownerId,

            {
                status: "Approved",
                accountStatus: "Active"
            }

        );


        res.json({

            message:
                "Tuition centre approved successfully 🚀",

            program

        });


    } catch (error) {

        console.log(error);

        res.status(500).json({

            message:
                "Could not approve tuition centre"

        });

    }

});


// =====================================================
// BLOCK TUITION CENTRE
// =====================================================
// IMPORTANT:
// We DO NOT individually block tutors/learners.
//
// The Program status becomes "Blocked".
//
// Later, login/access middleware will check:
//
// Program.status === "Blocked"
//
// Therefore the entire centre loses access:
// Owner
// Tutors
// Learners
// =====================================================

router.put("/block-program/:id", async (req, res) => {

    try {

        const program =
            await Program.findByIdAndUpdate(

                req.params.id,

                {
                    status: "Blocked",
                    subscriptionStatus: "Blocked"
                },

                {
                    new: true
                }

            );


        if (!program) {

            return res.status(404).json({

                message:
                    "Tuition centre not found"

            });

        }


        res.json({

            message:
                "Tuition centre blocked",

            program

        });


    } catch (error) {

        console.log(error);

        res.status(500).json({

            message:
                "Could not block tuition centre"

        });

    }

});


// =====================================================
// UNBLOCK TUITION CENTRE
// =====================================================

router.put("/unblock-program/:id", async (req, res) => {

    try {

        const program =
            await Program.findById(req.params.id);


        if (!program) {

            return res.status(404).json({

                message:
                    "Tuition centre not found"

            });

        }


        program.status = "Active";


        // If the centre was blocked by Admin,
        // restore its subscription state appropriately.
        //
        // We do NOT automatically mark it Paid unless
        // it actually has a valid payment.

        if (
            program.subscriptionStatus === "Blocked"
        ) {

            program.subscriptionStatus = "Pending";

        }


        await program.save();


        res.json({

            message:
                "Tuition centre unblocked successfully 🔓",

            program

        });


    } catch (error) {

        console.log(error);

        res.status(500).json({

            message:
                "Could not unblock tuition centre"

        });

    }

});


// =====================================================
// VIEW PAYMENT PROOF
// =====================================================
// Returns only the payment proof path.
// Admin can use this to open the uploaded proof.
// =====================================================

router.get("/program/:id/payment-proof", async (req, res) => {

    try {

        const program =
            await Program.findById(
                req.params.id
            ).select(
                "name paymentProof subscriptionStatus monthlyFee"
            );


        if (!program) {

            return res.status(404).json({

                message:
                    "Tuition centre not found"

            });

        }


        res.json({

            name: program.name,

            paymentProof:
                program.paymentProof,

            subscriptionStatus:
                program.subscriptionStatus,

            monthlyFee:
                program.monthlyFee

        });


    } catch (error) {

        console.log(error);

        res.status(500).json({

            message:
                "Could not fetch payment proof"

        });

    }

});
// =============================================
// ADMIN PLATFORM OVERVIEW
// =============================================

router.get("/overview", async (req, res) => {

    try {

        const totalCentres = await Program.countDocuments();

        const activeCentres = await Program.countDocuments({
            status: "Active"
        });

        const blockedCentres = await Program.countDocuments({
            status: "Blocked"
        });

        const pendingCentres = await Program.countDocuments({
            status: "Pending"
        });

        const totalLearners = await Learner.countDocuments();

        const totalTutors = await Tutor.countDocuments({
            role: "teacher"
        });

        const activeTutors = await Tutor.countDocuments({
            role: "teacher",
            accountStatus: "Active"
        });

        const settings =
            await PlatformSettings.findOne();

        res.json({

            totalCentres,

            activeCentres,

            blockedCentres,

            pendingCentres,

            totalLearners,

            totalTutors,

            activeTutors,

            monthlySubscription:
                settings?.monthlySubscription || 0,

            currency:
                settings?.currency || "ZAR"

        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Could not fetch platform overview"
        });

    }

});
// =====================================================
// CHANGE ADMIN LOGIN
// =====================================================

router.put("/change-login", async (req, res) => {

    try {

        const {
            currentPassword,
            newUsername,
            newPassword
        } = req.body;


        // Check required fields
        if (
            !currentPassword ||
            !newUsername ||
            !newPassword
        ) {

            return res.status(400).json({

                message:
                    "Current password, new username and new password are required"

            });

        }


        // Find Admin
        const admin =
            await Admin.findOne();


        if (!admin) {

            return res.status(404).json({

                message:
                    "Admin account not found"

            });

        }


        // Check current password
        const passwordCorrect =
            await bcrypt.compare(
                currentPassword,
                admin.passwordHash
            );


        if (!passwordCorrect) {

            return res.status(401).json({

                message:
                    "Current password is incorrect"

            });

        }


        // Check whether username is already used
        const usernameExists =
            await Admin.findOne({

                username:
                    newUsername.trim(),

                _id:
                    { $ne: admin._id }

            });


        if (usernameExists) {

            return res.status(409).json({

                message:
                    "Username is already in use"

            });

        }


        // Create new password hash
        const newPasswordHash =
            await bcrypt.hash(
                newPassword,
                10
            );


        // Update credentials
        admin.username =
            newUsername.trim();

        admin.passwordHash =
            newPasswordHash;


        await admin.save();


        res.json({

            message:
                "Admin login credentials updated successfully 🔐"

        });


    } catch (error) {

        console.log(
            "Change admin login error:",
            error
        );


        res.status(500).json({

            message:
                "Could not change admin login"

        });

    }

});
module.exports = router;