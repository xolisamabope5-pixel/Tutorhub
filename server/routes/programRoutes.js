const express = require("express");

const router = express.Router();

const Program = require("../models/Program");
const Tutor = require("../models/Tutor");
const Learner = require("../models/learner");
const PlatformSettings = require("../models/PlatformSettings");


// =====================================================
// GET ACTIVE TUITION CENTRES
// Used by learner registration
// =====================================================

router.get("/", async (req, res) => {

    try {

        const programs = await Program.find({

            status: "Active"

        }).select(

            "name location description"

        );


        res.json(programs);


    } catch (error) {

        console.log(error);


        res.status(500).json({

            message:
                "Could not fetch tuition centres"

        });

    }

});


// =====================================================
// GET PROGRAM TUTORS
// Used by learner registration
// =====================================================

router.get("/:id/tutors", async (req, res) => {

    try {

        const tutors = await Tutor.find({

            programId: req.params.id,

            status: "Approved",

            accountStatus: "Active"

        }).select(

            "name surname subjects role"

        );


        res.json(tutors);


    } catch (error) {

        console.log(error);


        res.status(500).json({

            message:
                "Could not fetch program tutors"

        });

    }

});


// =====================================================
// GET SINGLE PROGRAM
// =====================================================

router.get("/:id", async (req, res) => {

    try {

        const program =
            await Program.findById(

                req.params.id

            ).populate(

                "ownerId",

                "name surname"

            );


        if (!program) {

            return res.status(404).json({

                message:
                    "Tuition centre not found"

            });

        }


        res.json(program);


    } catch (error) {

        console.log(error);


        res.status(500).json({

            message:
                "Could not fetch tuition centre"

        });

    }

});


// =====================================================
// OWNER DASHBOARD
// =====================================================

router.get("/owner/:id", async (req, res) => {

    try {

        // =============================================
        // FIND OWNER'S CENTRE
        // =============================================

        const program =
            await Program.findOne({

                ownerId:
                    req.params.id

            }).populate(

                "ownerId",

                "name surname"

            );


        if (!program) {

            return res.status(404).json({

                message:
                    "Tuition centre not found"

            });

        }


        // =============================================
        // GET TEACHERS
        // =============================================

        const tutors =
            await Tutor.find({

                programId:
                    program._id

            }).select(

                "name surname subjects role status accountStatus"

            );


        // =============================================
        // GET LEARNERS
        // =============================================

        const learners =
            await Learner.find({

                programId:
                    program._id

            }).select(

                "name surname grade status paymentStatus paymentProof accountStatus tutorId"

            ).populate(

                "tutorId",

                "name surname"

            );


        // =============================================
        // GET TUTORHUB PLATFORM SETTINGS
        //
        // IMPORTANT:
        // This is returned ONLY to the OWNER
        // dashboard.
        //
        // Teachers never call this endpoint.
        // =============================================

        const platformSettings =
            await PlatformSettings.findOne();


        // =============================================
        // RETURN DASHBOARD
        // =============================================

        res.json({

            program,

            tutors,

            learners,

            tutorHubPayment: {

                bankName:
                    platformSettings?.bankName ||
                    "",

                accountHolder:
                    platformSettings?.accountHolder ||
                    "",

                accountNumber:
                    platformSettings?.accountNumber ||
                    "",

                branchCode:
                    platformSettings?.branchCode ||
                    "",

                monthlySubscription:
                    platformSettings?.monthlySubscription ||
                    0,

                currency:
                    platformSettings?.currency ||
                    "ZAR"

            }

        });


    } catch (error) {

        console.log(error);


        res.status(500).json({

            message:
                "Could not load owner dashboard"

        });

    }

});


// =====================================================
// OWNER SETTINGS
// =====================================================

router.get("/owner/:id/settings", async (req, res) => {

    try {

        const program =
            await Program.findOne({

                ownerId:
                    req.params.id

            });


        if (!program) {

            return res.status(404).json({

                message:
                    "Tuition centre not found"

            });

        }


        res.json(program);


    } catch (error) {

        console.log(error);


        res.status(500).json({

            message:
                "Could not load settings"

        });

    }

});


// =====================================================
// UPDATE OWNER SETTINGS
// =====================================================

router.put("/owner/:id/settings", async (req, res) => {

    try {

        const updatedProgram =
            await Program.findOneAndUpdate(

                {
                    ownerId:
                        req.params.id
                },

                req.body,

                {
                    new: true,
                    runValidators: true
                }

            );


        if (!updatedProgram) {

            return res.status(404).json({

                message:
                    "Tuition centre not found"

            });

        }


        res.json({

            message:
                "Settings updated successfully ✅",

            program:
                updatedProgram

        });


    } catch (error) {

        console.log(error);


        res.status(500).json({

            message:
                "Could not update settings"

        });

    }

});

// =====================================================
// OWNER UPLOAD TUTORHUB SUBSCRIPTION PAYMENT PROOF
// =====================================================

router.post(
    "/owner/:id/subscription-payment",
    async (req, res) => {

        try {

            const multer =
                require("multer");

            const path =
                require("path");

            const fs =
                require("fs");


            // =============================================
            // UPLOAD DIRECTORY
            // =============================================

            const uploadDirectory =
                path.join(
                    __dirname,
                    "../uploads"
                );


            if (!fs.existsSync(
                uploadDirectory
            )) {

                fs.mkdirSync(
                    uploadDirectory,
                    {
                        recursive: true
                    }
                );

            }


            // =============================================
            // STORAGE
            // =============================================

            const storage =
                multer.diskStorage({

                    destination:
                        function (
                            req,
                            file,
                            cb
                        ) {

                            cb(
                                null,
                                uploadDirectory
                            );

                        },

                    filename:
                        function (
                            req,
                            file,
                            cb
                        ) {

                            const uniqueName =
                                Date.now() +
                                "-" +
                                Math.round(
                                    Math.random() *
                                    1E9
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


            const upload =
                multer({

                    storage

                });


            upload.single(
                "paymentProof"
            )(req, res, async (uploadError) => {

                if (uploadError) {

                    console.log(
                        uploadError
                    );

                    return res.status(500).json({

                        message:
                            "Could not upload payment proof"

                    });

                }


                try {

                    if (!req.file) {

                        return res.status(400).json({

                            message:
                                "Please select a payment proof"

                        });

                    }


                    const program =
                        await Program.findOne({

                            ownerId:
                                req.params.id

                        });


                    if (!program) {

                        return res.status(404).json({

                            message:
                                "Tuition centre not found"

                        });

                    }


                    // =================================
                    // SAVE FILE PATH
                    // =================================

                    program.paymentProof =
                        `uploads/${req.file.filename}`;


                    // =================================
                    // PAYMENT NOW NEEDS ADMIN REVIEW
                    // =================================

                    program.subscriptionStatus =
                        "Pending";


                    await program.save();


                    res.json({

                        message:
                            "Payment proof uploaded successfully",

                        paymentProof:
                            program.paymentProof,

                        subscriptionStatus:
                            program.subscriptionStatus

                    });


                } catch (error) {

                    console.log(error);


                    res.status(500).json({

                        message:
                            "Could not save payment proof"

                    });

                }

            });

        } catch (error) {

            console.log(error);


            res.status(500).json({

                message:
                    "Could not upload payment proof"

            });

        }

    }
);
module.exports = router;
