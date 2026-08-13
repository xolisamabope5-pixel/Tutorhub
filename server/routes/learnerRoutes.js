const express = require("express");
const router = express.Router();

const Learner = require("../models/Learner");
const Program = require("../models/Program");
const Tutor = require("../models/Tutor");
const Payment = require("../models/Payment");

const multer = require("multer");
const path = require("path");
const bcrypt = require("bcrypt");


// =====================================================
// PAYMENT PROOF UPLOAD
// =====================================================

const storage = multer.diskStorage({

    destination: function(req, file, cb) {

        cb(null, "uploads/");

    },


    filename: function(req, file, cb) {

        cb(
            null,
            Date.now() + path.extname(file.originalname)
        );

    }

});


const upload = multer({
    storage
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
            // CHECK TUITION CENTRE
            // =============================================

            const program =
                await Program.findById(
                    learnerData.programId
                );


            if (!program) {

                return res.status(400).json({

                    message:
                        "Tuition centre not found"

                });

            }


            // =============================================
            // TUITION CENTRE MUST BE ACTIVE
            // =============================================

            if (program.status !== "Active") {

                return res.status(400).json({

                    message:
                        "This tuition centre is not currently accepting learners."

                });

            }


            // =============================================
            // CHECK TUTOR
            // =============================================

            const tutor =
                await Tutor.findOne({

                    _id: learnerData.tutorId,

                    programId: learnerData.programId

                });


            if (!tutor) {

                return res.status(400).json({

                    message:
                        "Tutor does not belong to this tuition centre"

                });

            }


            // =============================================
            // TUTOR MUST BE APPROVED
            // =============================================

            if (tutor.status !== "Approved") {

                return res.status(400).json({

                    message:
                        "Selected tutor is not currently available."

                });

            }


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

        const {
            username,
            password
        } = req.body;


        // =============================================
        // FIND LEARNER
        // =============================================

        const learner =
            await Learner.findOne({

                username

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

        res.json({

            message:
                "Login successful",

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