const express = require("express");
const router = express.Router();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Admin = require("../models/Admin");
const PlatformSettings = require("../models/PlatformSettings");
const Tutor = require("../models/Tutor");
const Learner = require("../models/learner");
const Program = require("../models/Program");

const {
    authenticate,
    authorizeRoles
} = require("../middleware/authMiddleware");


// =====================================================
// ADMIN AUTHENTICATION
// =====================================================
// EVERYTHING IN THIS FILE IS ADMIN ONLY.
//
// This protects:
// - Tuition centres
// - Centre approval
// - Centre blocking
// - Centre unblocking
// - Centre deletion
// - Payment proof
// - Platform overview
// - Admin credential changes
// =====================================================

router.use(
    authenticate,
    authorizeRoles("admin")
);


// =====================================================
// GET ALL TUITION CENTRES
// =====================================================

router.get("/programs", async (req, res) => {

    try {

        const programs =
            await Program.find()
                .populate(
                    "ownerId",
                    "name surname email"
                )
                .lean();


        const programsWithStats =
            await Promise.all(

                programs.map(
                    async (program) => {

                        const learnerCount =
                            await Learner.countDocuments({

                                programId:
                                    program._id

                            });


                        const tutorCount =
                            await Tutor.countDocuments({

                                programId:
                                    program._id,

                                role:
                                    "teacher"

                            });


                        return {

                            _id:
                                program._id,

                            name:
                                program.name,

                            location:
                                program.location,

                            description:
                                program.description,

                            owner:
                                program.ownerId
                                    ? {

                                        name:
                                            program.ownerId.name,

                                        surname:
                                            program.ownerId.surname,

                                        email:
                                            program.ownerId.email

                                    }
                                    : null,

                            paymentProof:
                                program.paymentProof,

                            monthlyFee:
                                program.monthlyFee,

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

                    }

                )

            );


        res.json(
            programsWithStats
        );


    } catch (error) {

        console.log(
            "Get programs error:",
            error
        );


        res.status(500).json({

            message:
                "Could not fetch tuition centres"

        });

    }

});


// =====================================================
// APPROVE TUITION CENTRE
// =====================================================

router.put(
    "/approve-program/:id",
    async (req, res) => {

        try {

            const program =
                await Program.findByIdAndUpdate(

                    req.params.id,

                    {
                        status:
                            "Active",

                        subscriptionStatus:
                            "Paid"
                    },

                    {
                        new:
                            true
                    }

                );


            if (!program) {

                return res.status(404).json({

                    message:
                        "Tuition centre not found"

                });

            }


            // =============================================
            // APPROVE OWNER
            // =============================================

            await Tutor.findByIdAndUpdate(

                program.ownerId,

                {
                    status:
                        "Approved",

                    accountStatus:
                        "Active"
                }

            );


            res.json({

                message:
                    "Tuition centre approved successfully 🚀",

                program

            });


        } catch (error) {

            console.log(
                "Approve program error:",
                error
            );


            res.status(500).json({

                message:
                    "Could not approve tuition centre"

            });

        }

    }
);


// =====================================================
// BLOCK TUITION CENTRE
// =====================================================
// IMPORTANT:
// We block the PROGRAM rather than individually
// modifying every learner/tutor.
//
// Their login/access checks already verify the
// Program.status.
// =====================================================

router.put(
    "/block-program/:id",
    async (req, res) => {

        try {

            const program =
                await Program.findByIdAndUpdate(

                    req.params.id,

                    {
                        status:
                            "Blocked",

                        subscriptionStatus:
                            "Blocked"
                    },

                    {
                        new:
                            true
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

            console.log(
                "Block program error:",
                error
            );


            res.status(500).json({

                message:
                    "Could not block tuition centre"

            });

        }

    }
);


// =====================================================
// UNBLOCK TUITION CENTRE
// =====================================================

router.put(
    "/unblock-program/:id",
    async (req, res) => {

        try {

            const program =
                await Program.findById(
                    req.params.id
                );


            if (!program) {

                return res.status(404).json({

                    message:
                        "Tuition centre not found"

                });

            }


            program.status =
                "Active";


            // =============================================
            // DO NOT AUTOMATICALLY MARK PAYMENT AS PAID
            // =============================================

            if (
                program.subscriptionStatus ===
                "Blocked"
            ) {

                program.subscriptionStatus =
                    "Pending";

            }


            await program.save();


            res.json({

                message:
                    "Tuition centre unblocked successfully 🔓",

                program

            });


        } catch (error) {

            console.log(
                "Unblock program error:",
                error
            );


            res.status(500).json({

                message:
                    "Could not unblock tuition centre"

            });

        }

    }
);


// =====================================================
// DELETE TUITION CENTRE
// =====================================================
// IMPORTANT:
//
// This permanently deletes:
// 1. The tuition centre
// 2. The centre owner
// 3. All tutors belonging to the centre
// 4. All learners belonging to the centre
//
// This route is ADMIN ONLY because of the
// authenticate + authorizeRoles middleware above.
//
// THIS ACTION CANNOT BE UNDONE.
// =====================================================

router.delete(
    "/delete-program/:id",
    async (req, res) => {

        try {

            const program =
                await Program.findById(
                    req.params.id
                );


            if (!program) {

                return res.status(404).json({

                    message:
                        "Tuition centre not found"

                });

            }


            const programId =
                program._id;

            const ownerId =
                program.ownerId;


            // =============================================
            // DELETE LEARNERS
            // =============================================

            const deletedLearners =
                await Learner.deleteMany({

                    programId:
                        programId

                });


            // =============================================
            // DELETE TUTORS
            // =============================================

            const deletedTutors =
                await Tutor.deleteMany({

                    programId:
                        programId

                });


            // =============================================
            // DELETE OWNER
            // =============================================
            // The owner is stored in Tutor because your
            // existing approval code updates the owner
            // using Tutor.findByIdAndUpdate().
            //
            // We only delete the owner if ownerId exists.

            let deletedOwner = null;

            if (ownerId) {

                deletedOwner =
                    await Tutor.findByIdAndDelete(
                        ownerId
                    );

            }


            // =============================================
            // DELETE PROGRAM
            // =============================================

            await Program.findByIdAndDelete(
                programId
            );


            // =============================================
            // RESPONSE
            // =============================================

            res.json({

                message:
                    "Tuition centre deleted successfully 🗑️",

                deleted: {

                    program:
                        true,

                    owner:
                        !!deletedOwner,

                    tutors:
                        deletedTutors.deletedCount,

                    learners:
                        deletedLearners.deletedCount

                }

            });


        } catch (error) {

            console.log(
                "Delete program error:",
                error
            );


            res.status(500).json({

                message:
                    "Could not delete tuition centre"

            });

        }

    }
);


// =====================================================
// VIEW PAYMENT PROOF
// =====================================================

router.get(
    "/program/:id/payment-proof",
    async (req, res) => {

        try {

            const program =
                await Program.findById(
                    req.params.id
                )
                .select(
                    "name paymentProof subscriptionStatus monthlyFee"
                );


            if (!program) {

                return res.status(404).json({

                    message:
                        "Tuition centre not found"

                });

            }


            res.json({

                name:
                    program.name,

                paymentProof:
                    program.paymentProof,

                subscriptionStatus:
                    program.subscriptionStatus,

                monthlyFee:
                    program.monthlyFee

            });


        } catch (error) {

            console.log(
                "Payment proof error:",
                error
            );


            res.status(500).json({

                message:
                    "Could not fetch payment proof"

            });

        }

    }
);


// =====================================================
// ADMIN PLATFORM OVERVIEW
// =====================================================

router.get(
    "/overview",
    async (req, res) => {

        try {

            const totalCentres =
                await Program.countDocuments();


            const activeCentres =
                await Program.countDocuments({

                    status:
                        "Active"

                });


            const blockedCentres =
                await Program.countDocuments({

                    status:
                        "Blocked"

                });


            const pendingCentres =
                await Program.countDocuments({

                    status:
                        "Pending"

                });


            const totalLearners =
                await Learner.countDocuments();


            const totalTutors =
                await Tutor.countDocuments({

                    role:
                        "teacher"

                });


            const activeTutors =
                await Tutor.countDocuments({

                    role:
                        "teacher",

                    accountStatus:
                        "Active"

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

            console.log(
                "Platform overview error:",
                error
            );


            res.status(500).json({

                message:
                    "Could not fetch platform overview"

            });

        }

    }
);


// =====================================================
// CHANGE ADMIN LOGIN
// =====================================================

router.put(
    "/change-login",
    async (req, res) => {

        try {

            const {
                currentPassword,
                newUsername,
                newPassword
            } = req.body;


            // =============================================
            // VALIDATION
            // =============================================

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


            if (
                newPassword.length < 5
            ) {

                return res.status(400).json({

                    message:
                        "New password must be at least 5 characters"

                });

            }


            // =============================================
            // GET ADMIN FROM VERIFIED JWT
            // =============================================

            const admin =
                await Admin.findById(
                    req.user.id
                );


            if (!admin) {

                return res.status(404).json({

                    message:
                        "Admin account not found"

                });

            }


            // =============================================
            // CHECK CURRENT PASSWORD
            // =============================================

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


            // =============================================
            // CLEAN USERNAME
            // =============================================

            const cleanedUsername =
                newUsername.trim();


            if (!cleanedUsername) {

                return res.status(400).json({

                    message:
                        "New username cannot be empty"

                });

            }


            // =============================================
            // CHECK USERNAME
            // =============================================

            const usernameExists =
                await Admin.findOne({

                    username:
                        cleanedUsername,

                    _id: {
                        $ne:
                            admin._id
                    }

                });


            if (usernameExists) {

                return res.status(409).json({

                    message:
                        "Username is already in use"

                });

            }


            // =============================================
            // HASH NEW PASSWORD
            // =============================================

            const newPasswordHash =
                await bcrypt.hash(

                    newPassword,

                    10

                );


            // =============================================
            // UPDATE
            // =============================================

            admin.username =
                cleanedUsername;

            admin.passwordHash =
                newPasswordHash;


            await admin.save();


            // =============================================
            // ISSUE NEW JWT
            // =============================================

            const newToken =
                jwt.sign(

                    {
                        id:
                            admin._id.toString(),

                        username:
                            admin.username,

                        role:
                            "admin"

                    },

                    process.env.JWT_SECRET,

                    {
                        expiresIn:
                            "7d"
                    }

                );


            // =============================================
            // RESPONSE
            // =============================================

            res.json({

                message:
                    "Admin login credentials updated successfully 🔐",

                username:
                    admin.username,

                token:
                    newToken

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

    }
);


module.exports = router;
