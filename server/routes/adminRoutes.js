const express = require("express");
const router = express.Router();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Admin = require("../models/Admin");
const PlatformSettings = require("../models/PlatformSettings");
const Tutor = require("../models/Tutor");
const Learner = require("../models/learner");
const Program = require("../models/Program");
const ProviderReview = require("../models/ProviderReview");

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


// Unified provider management: tuition centres and independent tutors.
router.get('/providers', async (req, res) => {
    try {
        const programs = await Program.find()
            .populate('ownerId', 'name surname email phone subjects status subscriptionStatus tutorhubPaymentProof')
            .sort({ createdAt: -1 }).lean();
        const rows = await Promise.all(programs.map(async (program) => {
            const owner = program.ownerId || {};
            const [learnerCount, tutorCount] = await Promise.all([
                Learner.countDocuments({ programId: program._id }),
                Tutor.countDocuments({ programId: program._id, role: 'teacher' })
            ]);
            return {
                _id: String(program._id), programId: String(program._id), ownerId: owner._id ? String(owner._id) : null,
                providerType: program.providerType || 'tuition-centre', businessName: program.name,
                ownerName: `${owner.name || ''} ${owner.surname || ''}`.trim(), email: owner.email || '',
                status: program.status || 'Pending', subscriptionStatus: program.subscriptionStatus || 'Pending',
                paymentProof: program.paymentProof || owner.tutorhubPaymentProof || '',
                location: program.location || '', subjects: program.subjectsOffered || [],
                expectedLearners: program.expectedLearners || 0, platformFee: program.platformFee || 0,
                customQuoteRequired: !!program.customQuoteRequired,
                learnerCount, tutorCount, createdAt: program.createdAt
            };
        }));
        // Retain support for old independent tutor accounts that predate Program records.
        const legacy = await Tutor.find({ role: 'owner', programId: null }).select('name surname email subjects status subscriptionStatus tutorhubPaymentProof createdAt').lean();
        for (const owner of legacy) rows.push({
            _id: `legacy-${owner._id}`, programId: null, ownerId: String(owner._id), providerType: 'private-tutor',
            businessName: `${owner.name} ${owner.surname}`, ownerName: `${owner.name} ${owner.surname}`,
            email: owner.email, status: owner.status || 'Pending', subscriptionStatus: owner.subscriptionStatus || 'Pending',
            paymentProof: owner.tutorhubPaymentProof || '', location: '', subjects: owner.subjects ? [owner.subjects] : [],
            learnerCount: await Learner.countDocuments({ tutorId: owner._id, programId: null }), tutorCount: 0, createdAt: owner.createdAt
        });
        res.json(rows);
    } catch (error) {
        console.error('Unified provider list error:', error);
        res.status(500).json({ message: 'Could not load providers.' });
    }
});

router.patch('/providers/:id/review', async (req, res) => {
    try {
        const { action, paymentVerified, note = '' } = req.body || {};
        if (!['approve', 'reject', 'block', 'unblock', 'verify-payment'].includes(action))
            return res.status(400).json({ message: 'Unsupported provider action.' });
        if (typeof note !== 'string' || note.length > 1000)
            return res.status(400).json({ message: 'Review note must be 1,000 characters or fewer.' });
        const isLegacy = String(req.params.id).startsWith('legacy-');
        const id = isLegacy ? req.params.id.slice(7) : req.params.id;
        if (!require('mongoose').isValidObjectId(id)) return res.status(400).json({ message: 'Invalid provider ID.' });
        const program = isLegacy ? null : await Program.findById(id);
        const owner = program ? await Tutor.findById(program.ownerId) : await Tutor.findOne({ _id: id, role: 'owner', programId: null });
        if (!owner || (!isLegacy && !program)) return res.status(404).json({ message: 'Provider not found.' });
        const previousStatus = program ? program.status : owner.status;
        if (action === 'approve') {
            if (paymentVerified !== true) return res.status(400).json({ message: 'Confirm that you inspected and verified the TutorHub payment proof before approval.' });
            if (!(program?.paymentProof || owner.tutorhubPaymentProof)) return res.status(400).json({ message: 'No TutorHub payment proof is on file.' });
            owner.status = 'Approved'; owner.accountStatus = 'Active'; owner.subscriptionStatus = 'Paid';
            if (program) { program.status = 'Active'; program.subscriptionStatus = 'Paid'; }
        } else if (action === 'reject') {
            owner.status = 'Rejected'; owner.accountStatus = 'Blocked';
            if (program) { program.status = 'Rejected'; program.subscriptionStatus = 'Pending'; }
        } else if (action === 'block') {
            owner.accountStatus = 'Blocked';
            if (program) { program.status = 'Blocked'; program.subscriptionStatus = 'Blocked'; }
        } else if (action === 'unblock') {
            owner.accountStatus = 'Active';
            if (program) { program.status = 'Active'; if (program.subscriptionStatus === 'Blocked') program.subscriptionStatus = 'Pending'; }
        } else if (action === 'verify-payment') {
            if (paymentVerified !== true) return res.status(400).json({ message: 'Payment verification must be explicitly confirmed.' });
            owner.subscriptionStatus = 'Paid';
            if (program) program.subscriptionStatus = 'Paid';
        }
        await owner.save(); if (program) await program.save();
        const auditAction = action === 'verify-payment' ? 'payment-verified' : `${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : action === 'block' ? 'blocked' : 'unblocked'}`;
        await ProviderReview.create({ adminId: req.user.id, ownerId: owner._id, programId: program?._id || null, action: auditAction, paymentVerified: paymentVerified === true, note: note.trim(), previousStatus: previousStatus || '', newStatus: program?.status || owner.status || '' });
        res.json({ message: 'Provider review saved.', provider: { ownerId: owner._id, programId: program?._id || null, status: program?.status || owner.status, subscriptionStatus: program?.subscriptionStatus || owner.subscriptionStatus } });
    } catch (error) {
        console.error('Provider review error:', error);
        res.status(500).json({ message: 'Could not update provider.' });
    }
});

router.get('/providers/:id/history', async (req, res) => {
    try {
        const id = String(req.params.id).replace(/^legacy-/, '');
        if (!require('mongoose').isValidObjectId(id)) return res.status(400).json({ message: 'Invalid provider ID.' });
        const program = await Program.findById(id).select('ownerId');
        const ownerId = program?.ownerId || id;
        const history = await ProviderReview.find({ ownerId }).populate('adminId', 'username').sort({ createdAt: -1 }).limit(100).lean();
        res.json(history);
    } catch (error) {
        console.error('Provider history error:', error);
        res.status(500).json({ message: 'Could not load provider history.' });
    }
});



// Super Admin directory for tutors attached to tuition centres.
router.get('/centre-tutors', async (req, res) => {
  try {
    const centreProgramIds = await Program.distinct('_id', { providerType: 'tuition-centre' });
    const tutors = await Tutor.find({ role: 'teacher', programId: { $in: centreProgramIds } })
      .populate('programId', 'name providerType').select('name surname email status accountStatus programId createdAt').sort({ createdAt: -1 }).lean();
    res.json(tutors.map((t) => ({ ...t, programName: t.programId?.name || 'Centre unavailable' })));
  } catch (error) { console.error('Centre tutor directory error:', error); res.status(500).json({ message: 'Could not load centre tutors.' }); }
});



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

router.put("/approve-program/:id", async (req, res) => {
    try {
        if (req.body?.paymentVerified !== true) return res.status(400).json({ message: "Confirm that you inspected and verified the TutorHub payment proof before approval." });
        const program = await Program.findById(req.params.id);
        if (!program) return res.status(404).json({ message: "Provider not found." });
        if (!program.paymentProof) return res.status(400).json({ message: "No TutorHub payment proof is on file." });
        const owner = await Tutor.findById(program.ownerId);
        if (!owner) return res.status(404).json({ message: "Provider owner not found." });
        const previousStatus = program.status;
        program.status = "Active";
        program.subscriptionStatus = "Paid";
        owner.status = "Approved";
        owner.accountStatus = "Active";
        owner.subscriptionStatus = "Paid";
        await Promise.all([program.save(), owner.save()]);
        await ProviderReview.create({ adminId: req.user.id, ownerId: owner._id, programId: program._id, action: "approved", paymentVerified: true, previousStatus: previousStatus || "", newStatus: "Active", note: "Approved through legacy admin action." });
        res.json({ message: "Provider approved successfully.", program });
    } catch (error) {
        console.error("Approve provider error:", error);
        res.status(500).json({ message: "Could not approve provider." });
    }
});

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



// Independent private tutors (owner accounts not linked to a tuition centre).
router.get("/private-tutors", async (req, res) => {
    try {
        const linkedPrograms = await Program.find({ providerType: "private-tutor" }).select("ownerId").lean();
        const linkedIds = linkedPrograms.map((item) => item.ownerId).filter(Boolean);
        const tutors = await Tutor.find({ role: "owner", $or: [{ programId: null }, { _id: { $in: linkedIds } }] })
            .select("name surname email subjects status subscriptionStatus tutorhubPaymentProof createdAt programId")
            .sort({ createdAt: -1 }).lean();
        const result = await Promise.all(tutors.map(async (tutor) => ({
            ...tutor,
            learnerCount: await Learner.countDocuments({ tutorId: tutor._id })
        })));
        res.json(result);
    } catch (error) {
        console.error("Private tutor list error:", error);
        res.status(500).json({ message: "Could not load private tutors." });
    }
});

router.put("/private-tutors/:id/status", async (req, res) => {
    try {
        const { status, paymentVerified } = req.body;
        if (!["Pending", "Approved", "Blocked"].includes(status)) {
            return res.status(400).json({ message: "Invalid private tutor status." });
        }
        if (status === "Approved" && paymentVerified !== true) {
            return res.status(400).json({ message: "Verify the tutor's payment proof before approval." });
        }
        const tutor = await Tutor.findOneAndUpdate(
            { _id: req.params.id, role: "owner", programId: null },
            { status, accountStatus: status === "Blocked" ? "Blocked" : "Active", ...(status === "Approved" ? { subscriptionStatus: "Paid" } : {}) },
            { new: true }
        ).select("name surname email subjects status subscriptionStatus");
        if (!tutor) return res.status(404).json({ message: "Private tutor not found." });
        res.json({ message: "Private tutor status updated.", tutor });
    } catch (error) {
        console.error("Private tutor status update error:", error);
        res.status(500).json({ message: "Could not update private tutor." });
    }
});

router.get(
    "/overview",
    async (req, res) => {

        try {

            const totalCentres =
                await Program.countDocuments({ providerType: "tuition-centre" });


            const activeCentres =
                await Program.countDocuments({ providerType: "tuition-centre", status: "Active" });


            const blockedCentres =
                await Program.countDocuments({ providerType: "tuition-centre", status: "Blocked" });


            const pendingCentres =
                await Program.countDocuments({ providerType: "tuition-centre", status: "Pending" });


            const totalLearners =
                await Learner.countDocuments();


            const centreProgramIdsForTutorCount = await Program.distinct("_id", { providerType: "tuition-centre" });
            const totalTutors = await Tutor.countDocuments({ role: "teacher", programId: { $in: centreProgramIdsForTutorCount } });

            // Independent tutor accounts are owners not attached to a centre.
            const privateProgramOwners = await Program.distinct("ownerId", { providerType: "private-tutor" });
            const legacyPrivateTutors = await Tutor.countDocuments({ role: "owner", programId: null });
            const privateTutors = new Set(privateProgramOwners.map(String)).size + legacyPrivateTutors;

            const centreProgramIds = await Program.distinct("_id", { providerType: "tuition-centre" });
            const privateProgramIds = await Program.distinct("_id", { providerType: "private-tutor" });
            const centreLearners = await Learner.countDocuments({ programId: { $in: centreProgramIds } });
            const privateTutorLearners = await Learner.countDocuments({ $or: [ { programId: { $in: privateProgramIds } }, { programId: null } ] });
            const pendingCentreTutorApplications = await Tutor.countDocuments({ role: "teacher", programId: { $in: centreProgramIds }, status: "Pending" });
            const pendingPrivateTutors = await Program.countDocuments({ providerType: "private-tutor", status: "Pending" });


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

                centreTutors: totalTutors,

                privateTutors,

                centreLearners,

                privateTutorLearners,

                pendingCentreTutorApplications,

                pendingPrivateTutors,

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
