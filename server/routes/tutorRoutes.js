const express = require("express");
const router = express.Router();

const Tutor = require("../models/Tutor");
const Program = require("../models/Program");

const bcrypt = require("bcrypt");

const multer = require("multer");
const path = require("path");
const fs = require("fs");


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
// TUTOR / OWNER REGISTRATION
// =====================================================

router.post(
    "/register",
    upload.single("paymentProof"),
    async (req, res) => {

        let createdTutor = null;
        let uploadedFile = null;

        try {

            const {
                programName,
                programId,
                role
            } = req.body;


            // =============================================
            // ACCOUNT TYPE
            // =============================================

            if (!role) {

                return res.status(400).json({

                    message:
                        "Please select account type"

                });

            }


            // =============================================
            // COPY FORM DATA
            // =============================================

            const tutorData = {
                ...req.body
            };


            delete tutorData.programName;


            // =============================================
            // REMOVE EMPTY PROGRAM ID
            // =============================================

            if (!tutorData.programId) {

                delete tutorData.programId;

            }


            // =============================================
            // OWNER REGISTRATION
            // =============================================

            if (role === "owner") {

                if (!programName) {

                    return res.status(400).json({

                        message:
                            "Please enter tuition centre name"

                    });

                }


                if (!tutorData.bankName) {

                    return res.status(400).json({

                        message:
                            "Please enter tuition centre bank name"

                    });

                }


                if (!tutorData.accountHolder) {

                    return res.status(400).json({

                        message:
                            "Please enter tuition centre account holder"

                    });

                }


                if (!tutorData.accountNumber) {

                    return res.status(400).json({

                        message:
                            "Please enter tuition centre account number"

                    });

                }


                if (!tutorData.branchCode) {

                    return res.status(400).json({

                        message:
                            "Please enter tuition centre branch code"

                    });

                }


                if (
                    tutorData.monthlyFee === undefined ||
                    tutorData.monthlyFee === ""
                ) {

                    return res.status(400).json({

                        message:
                            "Please enter monthly tuition fee"

                    });

                }


                if (!req.file) {

                    return res.status(400).json({

                        message:
                            "Please upload your TutorHub payment proof."

                    });

                }


                uploadedFile =
                    req.file.filename;

            }


            // =============================================
            // TEACHER REGISTRATION
            // =============================================

            if (role === "teacher") {

                if (!programId) {

                    return res.status(400).json({

                        message:
                            "Please select tuition centre"

                    });

                }


                const program =
                    await Program.findById(
                        programId
                    );


                if (
                    !program ||
                    program.status !== "Active"
                ) {

                    return res.status(400).json({

                        message:
                            "Tuition centre is not available"

                    });

                }


                tutorData.programId =
                    program._id;


                delete tutorData.bankName;
                delete tutorData.accountHolder;
                delete tutorData.accountNumber;
                delete tutorData.branchCode;
                delete tutorData.monthlyFee;


                if (req.file) {

                    try {

                        fs.unlinkSync(
                            req.file.path
                        );

                    } catch (error) {

                        console.log(
                            "Could not remove unused payment proof:",
                            error
                        );

                    }

                }

            }


            // =============================================
            // HASH PASSWORD
            // =============================================

            tutorData.password =
                await bcrypt.hash(

                    tutorData.password,

                    10

                );


            // =============================================
            // SET ROLE
            // =============================================

            tutorData.role =
                role;


            // =============================================
            // SET APPROVAL STATUS
            // =============================================

            tutorData.status =
                "Pending";


            // =============================================
            // CREATE TUTOR
            // =============================================

            const tutor =
                new Tutor(
                    tutorData
                );


            await tutor.save();


            createdTutor =
                tutor;


            // =============================================
            // OWNER CREATES PROGRAM
            // =============================================

            if (role === "owner") {

                const newProgram =
                    new Program({

                        name:
                            programName,

                        ownerId:
                            tutor._id,

                        status:
                            "Pending",

                        bankName:
                            tutorData.bankName,

                        accountHolder:
                            tutorData.accountHolder,

                        accountNumber:
                            tutorData.accountNumber,

                        branchCode:
                            tutorData.branchCode,

                        monthlyFee:
                            tutorData.monthlyFee,

                        paymentProof:
                            uploadedFile

                    });


                await newProgram.save();


                tutor.programId =
                    newProgram._id;


                await tutor.save();

            }


            // =============================================
            // SUCCESS
            // =============================================

            res.json({

                message:
                    "Registration submitted. Waiting for TutorHub admin approval 🚀",

                tutor

            });


        } catch (error) {

            console.log(error);


            // =============================================
            // ROLLBACK TUTOR
            // =============================================

            if (createdTutor) {

                try {

                    await Tutor.findByIdAndDelete(
                        createdTutor._id
                    );

                } catch (deleteError) {

                    console.log(
                        "Could not rollback tutor:",
                        deleteError
                    );

                }

            }


            // =============================================
            // ROLLBACK FILE
            // =============================================

            if (req.file) {

                try {

                    if (
                        fs.existsSync(
                            req.file.path
                        )
                    ) {

                        fs.unlinkSync(
                            req.file.path
                        );

                    }

                } catch (fileError) {

                    console.log(
                        "Could not remove uploaded file:",
                        fileError
                    );

                }

            }


            // =============================================
            // DUPLICATE
            // =============================================

            if (error.code === 11000) {

                return res.status(400).json({

                    message:
                        "Username or email already exists"

                });

            }


            res.status(500).json({

                message:
                    "Tutor registration failed",

                error:
                    error.message

            });

        }

    }
);


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

        const {
            username,
            password
        } = req.body;


        // =============================================
        // FIND TUTOR
        // =============================================

        const tutor =
            await Tutor.findOne({

                username

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

                message:
                    "Account waiting for TutorHub admin approval"

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

        res.json({

            message:
                "Login successful",

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