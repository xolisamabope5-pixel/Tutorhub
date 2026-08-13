const express = require("express");
const router = express.Router();

const OwnerPayment = require("../models/OwnerPayment");
const Program = require("../models/Program");

const multer = require("multer");
const path = require("path");
const fs = require("fs");


// =====================================================
// PAYMENT PROOF UPLOAD DIRECTORY
// =====================================================

const uploadDir = path.join(
    __dirname,
    "..",
    "uploads"
);


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

const storage = multer.diskStorage({

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

const upload = multer({

    storage: storage,

    limits: {

        fileSize:
            5 * 1024 * 1024

    },


    fileFilter: (
        req,
        file,
        cb
    ) => {

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
// CREATE OWNER PAYMENT
// =====================================================

router.post(
    "/create",
    upload.single("proof"),
    async (req, res) => {

        let createdPayment = null;

        try {

            const {

                ownerId,

                programId,

                month,

                year,

                amount

            } = req.body;


            // =============================================
            // REQUIRED FIELDS
            // =============================================

            if (!ownerId) {

                return res.status(400).json({

                    message:
                        "Owner ID is required"

                });

            }


            if (!programId) {

                return res.status(400).json({

                    message:
                        "Program ID is required"

                });

            }


            if (!month) {

                return res.status(400).json({

                    message:
                        "Payment month is required"

                });

            }


            if (!year) {

                return res.status(400).json({

                    message:
                        "Payment year is required"

                });

            }


            if (
                amount === undefined ||
                amount === ""
            ) {

                return res.status(400).json({

                    message:
                        "Payment amount is required"

                });

            }


            // =============================================
            // CHECK AMOUNT
            // =============================================

            if (
                Number(amount) <= 0
            ) {

                return res.status(400).json({

                    message:
                        "Payment amount must be greater than 0"

                });

            }


            // =============================================
            // CHECK PROGRAM
            // =============================================

            const program =
                await Program.findById(
                    programId
                );


            if (!program) {

                return res.status(404).json({

                    message:
                        "Tuition centre not found"

                });

            }


            // =============================================
            // MAKE SURE OWNER OWNS PROGRAM
            // =============================================

            if (
                program.ownerId.toString() !==
                ownerId.toString()
            ) {

                return res.status(403).json({

                    message:
                        "You are not the owner of this tuition centre"

                });

            }


            // =============================================
            // PAYMENT PROOF REQUIRED
            // =============================================

            if (!req.file) {

                return res.status(400).json({

                    message:
                        "Please upload payment proof"

                });

            }


            // =============================================
            // CREATE PAYMENT
            // =============================================

            const payment =
                new OwnerPayment({

                    ownerId,

                    programId,

                    month,

                    year:

                        Number(
                            year
                        ),

                    amount:

                        Number(
                            amount
                        ),

                    proof:
                        req.file.filename,

                    status:
                        "Pending"

                });


            await payment.save();


            createdPayment =
                payment;


            // =============================================
            // SUCCESS
            // =============================================

            res.status(201).json({

                message:
                    "TutorHub payment submitted successfully 🚀",

                payment

            });


        } catch (error) {

            console.log(
                "Owner payment error:",
                error
            );


            // =============================================
            // DELETE PAYMENT IF CREATED
            // =============================================

            if (
                createdPayment
            ) {

                try {

                    await OwnerPayment.findByIdAndDelete(
                        createdPayment._id
                    );

                } catch (deleteError) {

                    console.log(
                        "Could not delete payment:",
                        deleteError
                    );

                }

            }


            // =============================================
            // DELETE UPLOADED FILE
            // =============================================

            if (
                req.file
            ) {

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
                        "Could not remove uploaded proof:",
                        fileError
                    );

                }

            }


            res.status(500).json({

                message:
                    "Could not create TutorHub payment",

                error:
                    error.message

            });

        }

    }
);


// =====================================================
// GET OWNER PAYMENTS
// =====================================================

router.get(
    "/owner/:ownerId",
    async (req, res) => {

        try {

            const payments =
                await OwnerPayment.find({

                    ownerId:
                        req.params.ownerId

                })
                    .populate(
                        "programId",
                        "name"
                    )
                    .sort({

                        createdAt:
                            -1

                    });


            res.json(
                payments
            );


        } catch (error) {

            console.log(
                "Could not fetch owner payments:",
                error
            );


            res.status(500).json({

                message:
                    "Could not fetch TutorHub payments"

            });

        }

    }
);


// =====================================================
// GET ALL OWNER PAYMENTS
// ADMIN
// =====================================================

router.get(
    "/",
    async (req, res) => {

        try {

            const payments =
                await OwnerPayment.find()

                    .populate(
                        "ownerId",
                        "name surname email username"
                    )

                    .populate(
                        "programId",
                        "name"
                    )

                    .sort({

                        createdAt:
                            -1

                    });


            res.json(
                payments
            );


        } catch (error) {

            console.log(
                "Could not fetch all owner payments:",
                error
            );


            res.status(500).json({

                message:
                    "Could not fetch TutorHub payments"

            });

        }

    }
);


// =====================================================
// APPROVE OWNER PAYMENT
// =====================================================

router.put(
    "/:id/approve",
    async (req, res) => {

        try {

            const payment =
                await OwnerPayment.findByIdAndUpdate(

                    req.params.id,

                    {

                        status:
                            "Paid"

                    },

                    {

                        new:
                            true

                    }

                );


            if (!payment) {

                return res.status(404).json({

                    message:
                        "Payment not found"

                });

            }


            // =============================================
            // UPDATE PROGRAM SUBSCRIPTION
            // =============================================

            await Program.findByIdAndUpdate(

                payment.programId,

                {

                    subscriptionStatus:
                        "Paid"

                }

            );


            res.json({

                message:
                    "TutorHub payment approved successfully ✅",

                payment

            });


        } catch (error) {

            console.log(
                "Could not approve owner payment:",
                error
            );


            res.status(500).json({

                message:
                    "Could not approve payment"

            });

        }

    }
);


// =====================================================
// REJECT OWNER PAYMENT
// =====================================================

router.put(
    "/:id/reject",
    async (req, res) => {

        try {

            const payment =
                await OwnerPayment.findByIdAndUpdate(

                    req.params.id,

                    {

                        status:
                            "Rejected"

                    },

                    {

                        new:
                            true

                    }

                );


            if (!payment) {

                return res.status(404).json({

                    message:
                        "Payment not found"

                });

            }


            res.json({

                message:
                    "TutorHub payment rejected",

                payment

            });


        } catch (error) {

            console.log(
                "Could not reject owner payment:",
                error
            );


            res.status(500).json({

                message:
                    "Could not reject payment"

            });

        }

    }
);


module.exports = router;