const express = require("express");
const router = express.Router();

const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { v2: cloudinary } = require("cloudinary");

const DocumentAssignment = require("../models/DocumentAssignment");
const Class = require("../models/Class");
const { authenticate } = require("../middleware/authMiddleware");

const isTutor = (user) => ["teacher", "owner", "admin"].includes(user?.role);
async function canAccessClass(user, classId) {
    const cls = await Class.findById(classId);
    if (!cls) return { cls: null, allowed: false };
    const allowed = user.role === "admin" ||
        (isTutor(user) && String(cls.tutorId) === String(user.id)) ||
        (user.role === "learner" && (cls.learners || []).some(id => String(id) === String(user.id)));
    return { cls, allowed };
}



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
        use_filename: true,
        unique_filename: true,

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
    authenticate,
    (req, res, next) => isTutor(req.user) ? next() : res.status(403).json({ message: "Tutor access required." }),
    (req, res, next) => {
        upload.single("document")(req, res, (error) => {
            if (error) {
                console.log("DOCUMENT UPLOAD ERROR:", error);
                return res.status(500).json({
                    message: "Cloudinary document upload failed.",
                    error: error.message
                });
            }
            next();
        });
    },
    async (req, res) => {

        try {

            const {
                classId,
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
                !title ||
                !totalMarks ||
                !dueDate
            ) {

                return res.status(400).json({

                    message:
                        "Class, title, total marks and due date are required."

                });

            }


            if (!isTutor(req.user)) return res.status(403).json({ message: "Tutor access required." });
            const { cls, allowed } = await canAccessClass(req.user, classId);
            if (!cls) return res.status(404).json({ message: "Classroom not found." });
            if (!allowed) return res.status(403).json({ message: "You do not own this classroom." });

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

                    tutorId: req.user.id,

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
// VIEW DOCUMENT FILE
// =============================================

router.get(
    "/view/:id",
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

            if (!assignment.document) {

                return res.status(404).json({
                    message:
                        "Assignment document not found."
                });

            }

            const fileResponse =
                await fetch(assignment.document);

            if (!fileResponse.ok) {

                return res.status(502).json({
                    message:
                        "Could not retrieve assignment document."
                });

            }

            const contentType =
                assignment.documentName
                    ?.toLowerCase()
                    .endsWith(".pdf")
                    ? "application/pdf"
                    : "application/octet-stream";

            const buffer =
                Buffer.from(
                    await fileResponse.arrayBuffer()
                );

            res.setHeader(
                "Content-Type",
                contentType
            );

            res.setHeader("Content-Disposition", `inline; filename="${assignment.documentName || "assignment"}"`);

            res.send(buffer);

        } catch (error) {

            console.log(
                "View document error:",
                error
            );

            res.status(500).json({
                message:
                    "Could not open assignment document.",
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
    authenticate,
    async (req, res) => {

        try {

            const { cls, allowed } = await canAccessClass(req.user, req.params.id);
            if (!cls) return res.status(404).json({ message: "Classroom not found." });
            if (!allowed) return res.status(403).json({ message: "You are not enrolled in or assigned to this classroom." });

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
    authenticate,
    async (req, res) => {

        try {

            const assignment =
                await DocumentAssignment.findById(
                    req.params.id
                );


            if (!assignment) return res.status(404).json({ message: "Document assignment not found." });
            const { allowed } = await canAccessClass(req.user, assignment.classId);
            if (!allowed) return res.status(403).json({ message: "You cannot access this assignment." });
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
    authenticate,
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


            if (!isTutor(req.user)) return res.status(403).json({ message: "Tutor access required." });
            if (req.user.role !== "admin" && String(assignment.tutorId) !== String(req.user.id))
                return res.status(403).json({ message: "You do not own this assignment." });

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





