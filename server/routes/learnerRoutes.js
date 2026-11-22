const express = require("express");
const router = express.Router();

const Learner = require("../models/learner");
const Program = require("../models/Program");
const Tutor = require("../models/Tutor");
const Payment = require("../models/Payment");

const multer = require("multer");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


// =====================================================
// PAYMENT PROOF UPLOAD
// =====================================================

const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({

    destination: function(req, file, cb) {

        cb(null, uploadDir);

    },


    filename: function(req, file, cb) {

        cb(
            null,
            Date.now() + path.extname(file.originalname)
        );

    }

});


const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ["application/pdf", "image/jpeg", "image/png"];
        if (allowed.includes(file.mimetype)) return cb(null, true);
        cb(new Error("Payment proof must be a PDF, JPG or PNG file."));
    }
});


// =====================================================
// LEARNER REGISTRATION
// =====================================================

router.post(
    "/register",
    upload.single("paymentProof"),
    async (req, res) => {

        try {

            const learnerData = req.body;


            // =============================================
            // RESOLVE SELECTED PROVIDER
            // New flow supports either a tuition centre or an
            // independent private tutor. Legacy form fields remain accepted.
            // =============================================
            const providerType = learnerData.providerType || "tuition-centre";
            if (!learnerData.programId) {
                return res.status(400).json({ message: "Please choose a tuition centre or private tutor." });
            }

            const program = await Program.findById(learnerData.programId);
            if (!program || program.status !== "Active") {
                return res.status(400).json({ message: "This provider is not currently accepting learners." });
            }
            if (program.providerType !== providerType) {
                return res.status(400).json({ message: "The selected provider type does not match." });
            }

            let assignedTutor = null;
            if (providerType === "private-tutor") {
                assignedTutor = await Tutor.findOne({ _id: program.ownerId, status: "Approved", accountStatus: "Active" });
                if (!assignedTutor) return res.status(400).json({ message: "This private tutor is not currently available." });
            } else if (learnerData.tutorId) {
                assignedTutor = await Tutor.findOne({ _id: learnerData.tutorId, programId: program._id, status: "Approved", accountStatus: "Active" });
                if (!assignedTutor) return res.status(400).json({ message: "The selected tutor is not available at this centre." });
            } else {
                assignedTutor = await Tutor.findOne({ programId: program._id, role: "owner", status: "Approved", accountStatus: "Active" });
            }

            if (!learnerData.email || !/^\S+@\S+\.\S+$/.test(learnerData.email)) {
                return res.status(400).json({ message: "A valid email address is required for login." });
            }
            if (!learnerData.password || learnerData.password.length < 8) {
                return res.status(400).json({ message: "Password must contain at least 8 characters." });
            }
            const existingEmail = await Learner.findOne({ email: learnerData.email.toLowerCase().trim() });
            if (existingEmail) return res.status(409).json({ message: "An account with this email already exists." });
            if (!req.file) {
                return res.status(400).json({ message: "Please upload your payment proof." });
            }
            learnerData.providerType = providerType;
            learnerData.programId = program._id;
            learnerData.tutorId = assignedTutor?._id || null;
            learnerData.email = learnerData.email.toLowerCase().trim();
            learnerData.username = learnerData.email; // legacy login compatibility
            learnerData.school = learnerData.school || "";
            learnerData.subjects = learnerData.subjects || "";
            learnerData.tuitionOption = learnerData.tuitionOption || "";

            // =============================================
            // HASH PASSWORD
            // =============================================

            learnerData.password =
                await bcrypt.hash(
                    learnerData.password,
                    10
                );


            // =============================================
            // PAYMENT PROOF
            // =============================================

            if (req.file) {

                learnerData.paymentProof =
                    req.file.filename;

            }


            // =============================================
            // CREATE LEARNER
            // =============================================

            const learner =
                new Learner(
                    learnerData
                );


            await learner.save();


            // =============================================
            // SUCCESS
            // =============================================

            res.json({

                message:
                    "Registration submitted. Waiting for approval 🚀",

                learner

            });


        } catch (error) {

            console.log(error);


            if (error.code === 11000) {

                return res.status(400).json({

                    message:
                        "Username already exists"

                });

            }


            res.status(500).json({

                message:
                    "Registration failed"

            });

        }

    }
);


// =====================================================
// GET ALL LEARNERS
// =====================================================

router.get("/", async (req, res) => {

    try {

        const learners =
            await Learner.find()
                .populate(
                    "programId",
                    "name status"
                )
                .populate(
                    "tutorId",
                    "name surname"
                );


        res.json(learners);


    } catch (error) {

        console.log(error);


        res.status(500).json({

            message:
                "Could not fetch learners"

        });

    }

});


// =====================================================
// GET SINGLE LEARNER
// =====================================================

router.get("/:id", async (req, res) => {

    try {

        const learner =
            await Learner.findById(
                req.params.id
            )
            .populate(
                "programId",
                "name status"
            )
            .populate(
                "tutorId",
                "name surname"
            );


        if (!learner) {

            return res.status(404).json({

                message:
                    "Learner not found"

            });

        }


        res.json(learner);


    } catch (error) {

        console.log(error);


        res.status(500).json({

            message:
                "Could not fetch learner"

        });

    }

});


// =====================================================
// APPROVE LEARNER
// =====================================================

router.put("/:id/approve", async (req, res) => {

    try {

        const learner =
            await Learner.findByIdAndUpdate(

                req.params.id,

                {
                    status: "Approved"
                },

                {
                    new: true
                }

            );


        if (!learner) {

            return res.status(404).json({

                message:
                    "Learner not found"

            });

        }


        // =============================================
        // GET PROGRAM
        // =============================================

        const populatedLearner =
            await Learner.findById(
                learner._id
            )
            .populate("programId");


        // =============================================
        // CREATE FIRST PAYMENT RECORD
        // =============================================

        const existingPayment =
            await Payment.findOne({

                learnerId:
                    learner._id

            });


        if (!existingPayment) {

            const currentDate =
                new Date();


            await Payment.create({

                learnerId:
                    learner._id,

                programId:
                    populatedLearner.programId._id,

                month:
                    currentDate.toLocaleString(
                        "default",
                        {
                            month: "long"
                        }
                    ),

                year:
                    currentDate.getFullYear(),

                amount:
                    populatedLearner
                        .programId
                        .monthlyFee,

                proof:
                    learner.paymentProof,

                status:
                    "Paid"

            });

        }


        res.json({

            message:
                "Learner approved",

            learner:
                populatedLearner

        });


    } catch (error) {

        console.log(error);


        res.status(500).json({

            message:
                "Could not approve learner"

        });

    }

});


// =====================================================
// REJECT LEARNER
// =====================================================

router.put("/:id/reject", async (req, res) => {

    try {

        const learner =
            await Learner.findByIdAndUpdate(

                req.params.id,

                {
                    status: "Rejected"
                },

                {
                    new: true
                }

            );


        res.json({

            message:
                "Learner rejected",

            learner

        });


    } catch (error) {

        console.log(error);


        res.status(500).json({

            message:
                "Could not reject learner"

        });

    }

});


// =====================================================
// BLOCK LEARNER
// =====================================================

router.put("/:id/block", async (req, res) => {

    try {

        const learner =
            await Learner.findByIdAndUpdate(

                req.params.id,

                {
                    accountStatus: "Blocked"
                },

                {
                    new: true
                }

            );


        if (!learner) {

            return res.status(404).json({

                message:
                    "Learner not found"

            });

        }


        res.json({

            message:
                "Learner blocked successfully",

            learner

        });


    } catch (error) {

        console.log(error);


        res.status(500).json({

            message:
                "Could not block learner"

        });

    }

});


// =====================================================
// UNBLOCK LEARNER
// =====================================================

router.put("/:id/unblock", async (req, res) => {

    try {

        const learner =
            await Learner.findByIdAndUpdate(

                req.params.id,

                {
                    accountStatus: "Active"
                },

                {
                    new: true
                }

            );


        res.json({

            message:
                "Learner unblocked",

            learner

        });


    } catch (error) {

        console.log(error);


        res.status(500).json({

            message:
                "Could not unblock learner"

        });

    }

});


// =====================================================
// LEARNER LOGIN
// =====================================================

router.post("/login", async (req, res) => {

    try {

        const { username, email, password } = req.body;
        const loginIdentifier = String(email || username || "").trim();
        const emailIdentifier = loginIdentifier.toLowerCase();


        // =============================================
        // FIND LEARNER
        // =============================================

        const learner =
            await Learner.findOne({
                $or: [
                    { email: emailIdentifier },
                    { username: loginIdentifier }
                ]
            })
            .populate(
                "programId",
                "name location status monthlyFee"
            )
            .populate(
                "tutorId",
                "name surname subjects"
            );


        if (!learner) {

            return res.status(404).json({

                message:
                    "Account not found"

            });

        }


        // =============================================
        // PASSWORD
        // =============================================

        const match =
            await bcrypt.compare(

                password,

                learner.password

            );


        if (!match) {

            return res.status(401).json({

                message:
                    "Incorrect password"

            });

        }


        // =============================================
        // LEARNER APPROVAL
        // =============================================

        if (
            learner.status !==
            "Approved"
        ) {

            return res.status(403).json({

                message:
                    "Waiting for tuition approval"

            });

        }


        // =============================================
        // LEARNER ACCOUNT BLOCK
        // =============================================

        if (
            learner.accountStatus ===
            "Blocked"
        ) {

            return res.status(403).json({

                message:
                    "Your account has been blocked"

            });

        }


        // =============================================
        // PROGRAM MUST EXIST
        // =============================================

        if (!learner.programId) {

            return res.status(403).json({

                message:
                    "Your tuition centre could not be found."

            });

        }


        // =============================================
        // PROGRAM BLOCK CHECK
        // =============================================

        if (
            learner.programId.status ===
            "Blocked"
        ) {

            return res.status(403).json({

                message:
                    "Your tuition centre has been blocked by TutorHub. Please contact the administrator."

            });

        }


        // =============================================
        // PROGRAM MUST BE ACTIVE
        // =============================================

        if (
            learner.programId.status !==
            "Active"
        ) {

            return res.status(403).json({

                message:
                    "Your tuition centre is not currently active."

            });

        }


        // =============================================
        // LOGIN SUCCESS
        // =============================================

        const token = jwt.sign({ id: learner._id.toString(), role: "learner" }, process.env.JWT_SECRET, { expiresIn: "7d" });
        res.json({

            message:
                "Login successful",
            token,
            learner: {

                _id:
                    learner._id,

                name:
                    learner.name,

                surname:
                    learner.surname,

                grade:
                    learner.grade,

                school:
                    learner.school,

                subjects:
                    learner.subjects,

                username:
                    learner.username,

                programId:
                    learner.programId,

                tutorId:
                    learner.tutorId

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


module.exports = router;

