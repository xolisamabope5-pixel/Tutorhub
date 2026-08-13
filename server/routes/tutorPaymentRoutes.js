const express = require("express");
const multer = require("multer");
const path = require("path");
const Tutor = require("../models/Tutor");

const router = express.Router();


// =====================================================
// MULTER STORAGE
// =====================================================

const storage = multer.diskStorage({

    destination: function (req, file, cb) {

        cb(null, "uploads/");

    },

    filename: function (req, file, cb) {

        const uniqueName =
            Date.now() +
            "-" +
            Math.round(Math.random() * 1E9) +
            path.extname(file.originalname);

        cb(null, uniqueName);

    }

});


// =====================================================
// FILE FILTER
// =====================================================

const fileFilter = function (req, file, cb) {

    const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png"
    ];

    if (allowedTypes.includes(file.mimetype)) {

        cb(null, true);

    } else {

        cb(
            new Error(
                "Only PDF, JPG and PNG files are allowed."
            )
        );

    }

};


const upload = multer({

    storage: storage,

    fileFilter: fileFilter,

    limits: {

        fileSize: 5 * 1024 * 1024

    }

});


// =====================================================
// UPLOAD TUTORHUB PAYMENT PROOF
// =====================================================

router.post(
    "/upload-payment-proof/:id",
    upload.single("paymentProof"),
    async (req, res) => {

        try {

            // =========================================
            // CHECK FILE
            // =========================================

            if (!req.file) {

                return res.status(400).json({

                    message:
                        "Please upload a payment proof."

                });

            }


            // =========================================
            // FIND OWNER
            // =========================================

            const tutor =
                await Tutor.findById(req.params.id);


            if (!tutor) {

                return res.status(404).json({

                    message:
                        "Tutor account not found."

                });

            }


            // =========================================
            // SAVE FILE NAME
            // =========================================

            tutor.tutorhubPaymentProof =
                req.file.filename;


            await tutor.save();


            // =========================================
            // RESPONSE
            // =========================================

            res.json({

                message:
                    "Payment proof uploaded successfully ✅",

                filename:
                    req.file.filename

            });

        } catch (error) {

            console.log(
                "PAYMENT PROOF UPLOAD ERROR:",
                error
            );


            res.status(500).json({

                message:
                    "Could not upload payment proof."

            });

        }

    }
);


module.exports = router;