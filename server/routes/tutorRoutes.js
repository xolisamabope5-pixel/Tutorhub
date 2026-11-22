const express = require("express");
const router = express.Router();

const Tutor = require("../models/Tutor");
const Program = require("../models/Program");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { authenticate, authorizeRoles } = require("../middleware/authMiddleware");


// =====================================================
// PAYMENT PROOF UPLOAD
// =====================================================

const uploadDir =
    path.join(__dirname, "..", "uploads");


if (!fs.existsSync(uploadDir)) {

    fs.mkdirSync(
        uploadDir,
        {
            recursive: true
        }
    );

}


// =====================================================
// MULTER STORAGE
// =====================================================

const storage =
    multer.diskStorage({

        destination: (req, file, cb) => {

            cb(
                null,
                uploadDir
            );

        },


        filename: (req, file, cb) => {

            const uniqueName =
                Date.now() +
                "-" +
                Math.round(
                    Math.random() * 1E9
                ) +
                path.extname(
                    file.originalname
                );


            cb(
                null,
                uniqueName
            );

        }

    });


// =====================================================
// MULTER CONFIGURATION
// =====================================================

const upload =
    multer({

        storage: storage,

        limits: {

            fileSize:
                5 * 1024 * 1024

        },

        fileFilter:
            (req, file, cb) => {

                const allowedTypes = [

                    "application/pdf",

                    "image/jpeg",

                    "image/png"

                ];


                if (
                    allowedTypes.includes(
                        file.mimetype
                    )
                ) {

                    cb(
                        null,
                        true
                    );

                } else {

                    cb(
                        new Error(
                            "Only PDF, JPG and PNG files are allowed."
                        )
                    );

                }

            }

    });


// =====================================================
// PROVIDER REGISTRATION (TUITION CENTRE / PRIVATE TUTOR)
// =====================================================
const { quoteProviderFee } = require('../config/providerPricing');

router.post('/register', upload.single('paymentProof'), async (req, res) => {
  let createdTutor = null;
  let createdProgram = null;
  try {
    const name = String(req.body.name || '').trim();
    const surname = String(req.body.surname || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const providerType = String(req.body.providerType || '');

    if (!name || !surname || !email || !password || !providerType) {
      return res.status(400).json({ message: 'Name, surname, provider type, email and password are required.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Enter a valid email address.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must contain at least 8 characters.' });
    }
    if (!['tuition-centre', 'private-tutor'].includes(providerType)) {
      return res.status(400).json({ message: 'Choose Tuition Centre or Private Tutor.' });
    }
    if (await Tutor.findOne({ email })) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const programName = providerType === 'tuition-centre'
      ? String(req.body.programName || '').trim()
      : `${name} ${surname} - Private Tutor`;
    if (providerType === 'tuition-centre' && !programName) {
      return res.status(400).json({ message: 'Enter your tuition centre name.' });
    }

    const expectedLearners = providerType === 'tuition-centre'
      ? Number(req.body.expectedLearners)
      : 0;
    if (providerType === 'tuition-centre' && (!Number.isInteger(expectedLearners) || expectedLearners < 1 || expectedLearners > 10000)) {
      return res.status(400).json({ message: 'Enter the number of learners your tuition centre is bringing (1–10,000).' });
    }

    const quote = quoteProviderFee(providerType, expectedLearners);
    if (!quote.customQuoteRequired && !req.file) {
      return res.status(400).json({ message: 'Upload your TutorHub proof of payment before submitting.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const tutor = await Tutor.create({
      name, surname, email, username: email, password: passwordHash,
      businessName: programName, subjects: '', role: 'owner', status: 'Pending',
      accountStatus: 'Active', subscriptionStatus: 'Pending',
      tutorhubPaymentProof: req.file ? req.file.filename : ''
    });
    createdTutor = tutor;

    const program = await Program.create({
      name: programName, providerType, ownerId: tutor._id,
      expectedLearners, platformFee: quote.fee || 0,
      customQuoteRequired: quote.customQuoteRequired,
      status: 'Pending', subscriptionStatus: 'Pending',
      paymentProof: req.file ? req.file.filename : ''
    });
    createdProgram = program;
    tutor.programId = program._id;
    await tutor.save();

    return res.status(201).json({
      message: quote.customQuoteRequired
        ? 'Application submitted. TutorHub will contact you with a custom subscription quote before payment.'
        : 'Application and payment proof submitted. Your provider account is awaiting TutorHub admin approval.',
      application: {
        providerType, businessName: programName, expectedLearners,
        monthlyPlatformFee: quote.fee, customQuoteRequired: quote.customQuoteRequired,
        status: 'Pending', email
      }
    });
  } catch (error) {
    console.error('Provider registration error:', error);
    if (createdProgram) await Program.findByIdAndDelete(createdProgram._id).catch(() => {});
    if (createdTutor) await Tutor.findByIdAndDelete(createdTutor._id).catch(() => {});
    if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    if (error.code === 11000) return res.status(409).json({ message: 'An account with this email already exists.' });
    return res.status(500).json({ message: 'Provider registration failed. Please try again.' });
  }
});

// =====================================================
// CENTRE TUTOR REGISTRATION AND OWNER APPROVAL
// =====================================================
router.get('/active-centres', async (req, res) => {
  try {
    const centres = await Program.find({ providerType: 'tuition-centre', status: 'Active' })
      .select('_id name location').sort({ name: 1 }).lean();
    res.json(centres);
  } catch (error) {
    console.error('Active centre list error:', error);
    res.status(500).json({ message: 'Could not load active tuition centres.' });
  }
});

router.post('/register-centre-tutor', async (req, res) => {
  try {
    const body = req.body || {};
    const name = String(body.name || '').trim();
    const surname = String(body.surname || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const programId = String(body.programId || '').trim();
    if (!name || !surname || !email || !password || !programId)
      return res.status(400).json({ message: 'Complete all fields and select your tuition centre.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return res.status(400).json({ message: 'Enter a valid email address.' });
    if (password.length < 8) return res.status(400).json({ message: 'Password must contain at least 8 characters.' });
    if (!/^[a-f\d]{24}$/i.test(programId)) return res.status(400).json({ message: 'The selected tuition centre is invalid. Please select it again.' });

    const program = await Program.findOne({ _id: programId, providerType: 'tuition-centre', status: 'Active' }).select('_id name ownerId');
    if (!program) return res.status(400).json({ message: 'This tuition centre is no longer accepting tutor applications. Refresh the page and choose an active centre.' });

    // Check both fields because older TutorHub accounts may have a username that
    // is different from, or duplicated independently of, their email address.
    const existingTutor = await Tutor.findOne({ $or: [{ email }, { username: email }] }).select('_id');
    if (existingTutor) return res.status(409).json({ message: 'An account with this email already exists. Please sign in or use another email address.' });

    const passwordHash = await bcrypt.hash(password, 12);
    const tutor = await Tutor.create({
      name, surname, email, username: email, password: passwordHash,
      businessName: program.name, programId: program._id,
      role: 'teacher', status: 'Pending',
      // Pending status blocks login until owner approval. accountStatus remains
      // Active because its schema only represents an owner's active/blocked switch.
      accountStatus: 'Active', subscriptionStatus: 'Pending'
    });
    return res.status(201).json({
      message: `Application submitted successfully to ${program.name}. The centre owner must approve your tutor account before you can sign in.`,
      application: { id: tutor._id, status: tutor.status, centre: program.name }
    });
  } catch (error) {
    console.error('Centre tutor registration error:', error);
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0];
      return res.status(409).json({ message: duplicateField === 'username' ? 'This email is already linked to an existing TutorHub username. Please use another email or contact support.' : 'An account with this email already exists.' });
    }
    if (error.name === 'ValidationError') return res.status(400).json({ message: `Please check the application details: ${Object.values(error.errors).map(item => item.message).join('; ')}` });
    return res.status(500).json({ message: 'Could not submit your centre tutor application. Please try again or contact TutorHub support.', detail: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
});

router.get('/centre-applications', authenticate, authorizeRoles('owner'), async (req, res) => {
  try {
    const owner = await Tutor.findById(req.user.id).select('role programId');
    if (!owner || owner.role !== 'owner' || !owner.programId) return res.status(403).json({ message: 'Centre owner access required.' });
    const program = await Program.findOne({ _id: owner.programId, ownerId: owner._id, providerType: 'tuition-centre' });
    if (!program) return res.status(403).json({ message: 'No tuition centre is linked to this owner.' });
    const tutors = await Tutor.find({ programId: program._id, role: 'teacher' }).select('name surname email status subjects createdAt').sort({ createdAt: -1 }).lean();
    res.json(tutors);
  } catch (error) { console.error('Centre tutor applications error:', error); res.status(500).json({ message: 'Could not load tutor applications.' }); }
});

router.patch('/centre-applications/:id', authenticate, authorizeRoles('owner'), async (req, res) => {
  try {
    const action = req.body.action;
    if (!['approve', 'reject'].includes(action)) return res.status(400).json({ message: 'Choose approve or reject.' });
    const owner = await Tutor.findById(req.user.id).select('role programId');
    if (!owner || owner.role !== 'owner' || !owner.programId) return res.status(403).json({ message: 'Centre owner access required.' });
    const program = await Program.findOne({ _id: owner.programId, ownerId: owner._id, providerType: 'tuition-centre', status: 'Active' });
    if (!program) return res.status(403).json({ message: 'Active centre owner access required.' });
    const tutor = await Tutor.findOne({ _id: req.params.id, programId: program._id, role: 'teacher' });
    if (!tutor) return res.status(404).json({ message: 'Tutor application not found in your centre.' });
    if (tutor.status !== 'Pending') return res.status(409).json({ message: 'This tutor application has already been reviewed.' });
    tutor.status = action === 'approve' ? 'Approved' : 'Rejected';
    tutor.accountStatus = action === 'approve' ? 'Active' : 'Blocked';
    await tutor.save();
    res.json({ message: `Tutor application ${action === 'approve' ? 'approved' : 'rejected'}.`, tutor: { id: tutor._id, status: tutor.status } });
  } catch (error) { console.error('Centre tutor review error:', error); res.status(500).json({ message: 'Could not update tutor application.' }); }
});

// =====================================================
// GET ALL TUTORS
// =====================================================

router.get("/", async (req, res) => {

    try {

        const tutors =
            await Tutor.find()
                .populate(
                    "programId",
                    "name status"
                );


        res.json(tutors);


    } catch (error) {

        console.log(error);


        res.status(500).json({

            message:
                "Could not fetch tutors"

        });

    }

});


// =====================================================
// GET SINGLE TUTOR
// =====================================================

router.get("/:id", async (req, res) => {

    try {

        const tutor =
            await Tutor.findById(
                req.params.id
            )
            .populate(
                "programId",
                "name status"
            );


        if (!tutor) {

            return res.status(404).json({

                message:
                    "Tutor not found"

            });

        }


        res.json(tutor);


    } catch (error) {

        console.log(error);


        res.status(500).json({

            message:
                "Could not fetch tutor"

        });

    }

});


// =====================================================
// APPROVE TUTOR / OWNER
// =====================================================

router.put("/:id/approve", async (req, res) => {

    try {

        const tutor =
            await Tutor.findByIdAndUpdate(

                req.params.id,

                {
                    status:
                        "Approved"
                },

                {
                    new:
                        true
                }

            );


        if (!tutor) {

            return res.status(404).json({

                message:
                    "Tutor not found"

            });

        }


        // =============================================
        // ACTIVATE CENTRE AFTER OWNER APPROVAL
        // =============================================

        if (
            tutor.role ===
            "owner"
        ) {

            await Program.findByIdAndUpdate(

                tutor.programId,

                {
                    status:
                        "Active"
                }

            );

        }


        res.json({

            message:
                "Tutor approved successfully",

            tutor

        });


    } catch (error) {

        console.log(error);


        res.status(500).json({

            message:
                "Could not approve tutor"

        });

    }

});


// =====================================================
// REJECT / BLOCK TUTOR
// =====================================================

router.put("/:id/reject", async (req, res) => {

    try {

        const tutor =
            await Tutor.findByIdAndUpdate(

                req.params.id,

                {
                    status:
                        "Blocked"
                },

                {
                    new:
                        true
                }

            );


        if (!tutor) {

            return res.status(404).json({

                message:
                    "Tutor not found"

            });

        }


        res.json({

            message:
                "Tutor blocked",

            tutor

        });


    } catch (error) {

        console.log(error);


        res.status(500).json({

            message:
                "Could not block tutor"

        });

    }

});


// =====================================================
// UNBLOCK TUTOR
// =====================================================

router.put("/:id/unblock", async (req, res) => {

    try {

        const tutor =
            await Tutor.findByIdAndUpdate(

                req.params.id,

                {
                    status:
                        "Approved"
                },

                {
                    new:
                        true
                }

            );


        if (!tutor) {

            return res.status(404).json({

                message:
                    "Tutor not found"

            });

        }


        res.json({

            message:
                "Tutor unblocked successfully 🚀",

            tutor

        });


    } catch (error) {

        console.log(error);


        res.status(500).json({

            message:
                "Could not unblock tutor"

        });

    }

});


// =====================================================
// TUTOR LOGIN
// =====================================================

router.post("/login", async (req, res) => {

    try {

        const { username, email, password } = req.body;
        const loginIdentifier = (email || username || "").toLowerCase().trim();


        // =============================================
        // FIND TUTOR
        // =============================================

        const tutor =
            await Tutor.findOne({
                $or: [{ email: loginIdentifier }, { username: loginIdentifier }]
            });


        if (!tutor) {

            return res.status(404).json({

                message:
                    "Tutor account not found"

            });

        }


        // =============================================
        // ADMIN APPROVAL
        // =============================================

        if (
            tutor.status !==
            "Approved"
        ) {

            return res.status(403).json({
                message: tutor.role === "teacher" && tutor.programId
                    ? "Your application is waiting for approval from your tuition centre owner."
                    : "Account waiting for TutorHub admin approval"
            });

        }


        // =============================================
        // PASSWORD
        // =============================================

        const match =
            await bcrypt.compare(

                password,

                tutor.password

            );


        if (!match) {

            return res.status(401).json({

                message:
                    "Incorrect password"

            });

        }


        // =============================================
        // CHECK TUITION CENTRE
        // =============================================

        if (tutor.programId) {

            const program =
                await Program.findById(
                    tutor.programId
                );


            if (!program) {

                return res.status(403).json({

                    message:
                        "Your tuition centre could not be found."

                });

            }


            // =========================================
            // BLOCKED CENTRE
            // =========================================

            if (
                program.status ===
                "Blocked"
            ) {

                return res.status(403).json({

                    message:
                        "Your tuition centre has been blocked by TutorHub. Please contact the administrator."

                });

            }


            // =========================================
            // CENTRE MUST BE ACTIVE
            // =========================================

            if (
                program.status !==
                "Active"
            ) {

                return res.status(403).json({

                    message:
                        "Your tuition centre is not currently active."

                });

            }

        }


        // =============================================
        // LOGIN SUCCESS
        // =============================================

        const token = jwt.sign({ id: tutor._id.toString(), role: tutor.role === "owner" ? "owner" : "teacher" }, process.env.JWT_SECRET, { expiresIn: "7d" });
        res.json({

            message:
                "Login successful",
            token,

            tutor: {

                id:
                    tutor._id,

                name:
                    tutor.name,

                surname:
                    tutor.surname,

                role:
                    tutor.role,

                programId:
                    tutor.programId,

                subjects:
                    tutor.subjects,

                status:
                    tutor.status

            }

        });


    } catch (error) {

        console.log(error);


        res.status(500).json({

            message:
                "Login failed"

        });

    }

});


// =====================================================
// CHANGE OWNER PASSWORD
// =====================================================

router.put("/:id/change-password", async (req, res) => {

    try {

        const {
            currentPassword,
            newPassword
        } = req.body;


        if (
            !currentPassword ||
            !newPassword
        ) {

            return res.status(400).json({

                message:
                    "Current password and new password are required"

            });

        }


        if (newPassword.length < 5) {

            return res.status(400).json({

                message:
                    "New password must be at least 5 characters"

            });

        }


        const tutor =
            await Tutor.findById(
                req.params.id
            );


        if (!tutor) {

            return res.status(404).json({

                message:
                    "Owner not found"

            });

        }


        const match =
            await bcrypt.compare(

                currentPassword,

                tutor.password

            );


        if (!match) {

            return res.status(400).json({

                message:
                    "Current password is incorrect"

            });

        }


        tutor.password =
            await bcrypt.hash(

                newPassword,

                10

            );


        await tutor.save();


        res.json({

            message:
                "Password changed successfully ✅"

        });


    } catch (error) {

        console.log(error);


        res.status(500).json({

            message:
                "Could not change password"

        });

    }

});


module.exports = router;