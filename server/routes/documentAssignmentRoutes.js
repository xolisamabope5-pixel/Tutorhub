const express = require("express");
const router = express.Router();

const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { v2: cloudinary } = require("cloudinary");

const DocumentAssignment = require("../models/DocumentAssignment");


// =============================================
// CLOUDINARY CONFIGURATION
// =============================================

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


// =============================================
// CLOUDINARY STORAGE
// =============================================

const storage = new CloudinaryStorage({

    cloudinary,

    params: {

        folder: "tutorhub/document-assignments",

        resource_type: "auto",

        allowed_formats: [
            "pdf",
            "doc",
            "docx"
        ]

    }

});


const upload = multer({
    storage
});


// =============================================
// CREATE DOCUMENT ASSIGNMENT
// =============================================

router.post(
    "/create",
    upload.single("document"),
    async (req, res) => {

        try {

            const {
                classId,
                tutorId,
                title,
                description,
                totalMarks,
                dueDate
            } = req.body;


            // =============================================
            // VALIDATION
            // =============================================

            if (
                !classId ||
                !tutorId ||
                !title ||
                !totalMarks ||
                !dueDate
            ) {

                return res.status(400).json({

                    message:
                        "Class, tutor, title, total marks and due date are required."

                });

            }


            if (!req.file) {

                return res.status(400).json({

                    message:
                        "Please upload an assignment document."

                });

            }


            // =============================================
            // CREATE ASSIGNMENT
            // =============================================

            const assignment =
                new DocumentAssignment({

                    classId,

                    tutorId,

                    title,

                    description:
                        description || "",

                    document:
                        req.file.path,

                    documentName:
                        req.file.originalname,

                    totalMarks:
                        Number(totalMarks),

                    dueDate

                });


            await assignment.save();


            // =============================================
            // RESPONSE
            // =============================================

            res.status(201).json({

                message:
                    "Document assignment created successfully.",

                assignment

            });


        } catch (error) {

            console.log(
                "Create document assignment error:",
                error
            );


            res.status(500).json({

                message:
                    "Could not create document assignment.",

                error:
                    error.message

            });

        }

    }
);


// =============================================
// GET DOCUMENT ASSIGNMENTS FOR CLASS
// =============================================

router.get(
    "/class/:id",
    async (req, res) => {

        try {

            const assignments =
                await DocumentAssignment.find({

                    classId:
                        req.params.id

                }).sort({

                    createdAt: -1

                });


            res.json(assignments);


        } catch (error) {

            console.log(
                "Get document assignments error:",
                error
            );


            res.status(500).json({

                message:
                    "Could not load document assignments."

            });

        }

    }
);


// =============================================
// GET SINGLE DOCUMENT ASSIGNMENT
// =============================================

router.get(
    "/:id",
    async (req, res) => {

        try {

            const assignment =
                await DocumentAssignment.findById(
                    req.params.id
                );


            if (!assignment) {

                return res.status(404).json({

                    message:
                        "Document assignment not found."

                });

            }


            res.json(assignment);


        } catch (error) {

            console.log(
                "Get document assignment error:",
                error
            );


            res.status(500).json({

                message:
                    "Could not load document assignment."

            });

        }

    }
);


// =============================================
// DELETE DOCUMENT ASSIGNMENT
// =============================================

router.delete(
    "/:id",
    async (req, res) => {

        try {

            const assignment =
                await DocumentAssignment.findById(
                    req.params.id
                );


            if (!assignment) {

                return res.status(404).json({

                    message:
                        "Document assignment not found."

                });

            }


            await DocumentAssignment.findByIdAndDelete(
                req.params.id
            );


            res.json({

                message:
                    "Document assignment deleted successfully."

            });


        } catch (error) {

            console.log(
                "Delete document assignment error:",
                error
            );


            res.status(500).json({

                message:
                    "Could not delete document assignment.",

                error:
                    error.message

            });

        }

    }
);


module.exports = router;