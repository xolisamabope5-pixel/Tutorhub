const express = require("express");

const router = express.Router();

const multer = require("multer");
const CloudinaryStorage = require("../config/cloudinaryStorage");
const { v2: cloudinary } = require("cloudinary");

const DocumentSubmission =
    require("../models/DocumentSubmission");
const DocumentAssignment = require("../models/DocumentAssignment");
const Class = require("../models/Class");
const { authenticate } = require("../middleware/authMiddleware");
router.use(authenticate);
const isTutor = (u) => ["teacher", "owner", "admin"].includes(u?.role);
async function tutorOwnsAssignment(user, assignment) {
    return user.role === "admin" || (isTutor(user) && String(assignment.tutorId) === String(user.id));
}
async function learnerBelongs(learnerId, assignment) {
    const cls = await Class.findById(assignment.classId);
    return !!cls && (cls.learners || []).some(id => String(id) === String(learnerId));
}


// =====================================================
// CLOUDINARY CONFIGURATION
// =====================================================

cloudinary.config({

    cloud_name:
        process.env.CLOUDINARY_CLOUD_NAME,

    api_key:
        process.env.CLOUDINARY_API_KEY,

    api_secret:
        process.env.CLOUDINARY_API_SECRET

});


// =====================================================
// CLOUDINARY STORAGE
// =====================================================

const storage =
    new CloudinaryStorage({

        cloudinary,

        params: {

            folder:
                "tutorhub/document-submissions",

            resource_type:
                "auto",

            allowed_formats: [

                "pdf",

                "doc",

                "docx",

                "jpg",

                "jpeg",

                "png"

            ]

        }

    });


// =====================================================
// MULTER
// =====================================================

const upload =
    multer({

        storage

    });


// =====================================================
// CREATE / UPDATE LEARNER SUBMISSION
// =====================================================

router.post(

    "/create",

    (req, res, next) => req.user?.role === "learner" ? next() : res.status(403).json({ message: "Learner access required." }),
    upload.array("files", 10),

    async (req, res) => {

        try {

            const { assignmentId } = req.body;
            if (!assignmentId) return res.status(400).json({ message: "Assignment ID is required." });
            const learnerId = req.user.id;
            const assignment = await DocumentAssignment.findById(assignmentId);
            if (!assignment) return res.status(404).json({ message: "Assignment not found." });
            if (!(await learnerBelongs(learnerId, assignment))) return res.status(403).json({ message: "You are not enrolled in this classroom." });


            // =================================================
            // VALIDATION
            // =================================================

            if (
                !assignmentId ||
                !learnerId
            ) {

                return res.status(400).json({

                    message:
                        "Assignment and learner information are required."

                });

            }


            if (
                !req.files ||
                req.files.length === 0
            ) {

                return res.status(400).json({

                    message:
                        "Please upload at least one submission file."

                });

            }


            // =================================================
            // CHECK EXISTING SUBMISSION
            // =================================================

            const existingSubmission =
                await DocumentSubmission.findOne({

                    assignmentId,

                    learnerId

                });


            // =================================================
            // DO NOT ALLOW CHANGES AFTER MARKING
            // =================================================

            if (
                existingSubmission &&
                existingSubmission.mark !== null &&
                existingSubmission.mark !== undefined
            ) {

                return res.status(400).json({

                    message:
                        "This submission has already been marked and cannot be changed."

                });

            }


            // =================================================
            // PREPARE CLOUDINARY FILES
            // =================================================

            const uploadedFiles =
                req.files.map((file) => ({

                    url:
                        file.path,

                    name:
                        file.originalname

                }));


            // =================================================
            // UPDATE EXISTING SUBMISSION
            // =================================================

            if (existingSubmission) {

                existingSubmission.files =
                    uploadedFiles;

                existingSubmission.status =
                    "Submitted";

                existingSubmission.mark =
                    null;
                existingSubmission.resultVisible = false;
                existingSubmission.resultVisibleAt = null;

                existingSubmission.feedback =
                    "";

                existingSubmission.markedDocument =
                    null;


                await existingSubmission.save();


                return res.json(

                    existingSubmission

                );

            }


            // =================================================
            // CREATE NEW SUBMISSION
            // =================================================

            const submission =
                new DocumentSubmission({

                    assignmentId,

                    learnerId,

                    files:
                        uploadedFiles,

                    mark:
                        null,

                    feedback:
                        "",

                    markedDocument:
                        null,

                    status:
                        "Submitted",
                    resultVisible: false

                });


            await submission.save();


            res.status(201).json(

                submission

            );


        } catch (error) {

            console.log(

                "Create document submission error:",

                error

            );


            res.status(500).json({

                message:
                    "Could not submit assignment.",

                error:
                    error.message

            });

        }

    }

);


// =====================================================
// GET ALL SUBMISSIONS FOR DOCUMENT ASSIGNMENT
// =====================================================

router.get(

    "/assignment/:assignmentId",

    async (req, res) => {

        try {

            const assignment = await DocumentAssignment.findById(req.params.assignmentId);
            if (!assignment) return res.status(404).json({ message: "Assignment not found." });
            if (!(await tutorOwnsAssignment(req.user, assignment))) return res.status(403).json({ message: "You do not own this assignment." });

            const submissions =
                await DocumentSubmission.find({

                    assignmentId:
                        req.params.assignmentId

                })

                .populate("learnerId")

                .populate("assignmentId");


            res.json(

                submissions

            );


        } catch (error) {

            console.log(

                "Get document submissions error:",

                error

            );


            res.status(500).json({

                message:
                    "Could not load submissions."

            });

        }

    }

);


// =====================================================
// GET LEARNER'S SUBMISSION
// =====================================================

router.get(

    "/learner/:learnerId/:assignmentId",

    async (req, res) => {

        try {

            if (req.user.role !== "learner" || String(req.user.id) !== String(req.params.learnerId))
                return res.status(403).json({ message: "You can only view your own submission." });
            const submission =
                await DocumentSubmission.findOne({

                    learnerId:
                        req.user.id,

                    assignmentId:
                        req.params.assignmentId

                })

                .populate("assignmentId");


            if (!submission) {

                return res.status(404).json({

                    message:
                        "No submission found."

                });

            }


            const learnerView = submission.toObject();
            if (learnerView.status !== "Marked" || learnerView.resultVisible !== true) {
                learnerView.mark = null;
                learnerView.feedback = "";
                learnerView.markedDocument = null;
            }
            res.json(learnerView);


        } catch (error) {

            console.log(

                "Get learner document submission error:",

                error

            );


            res.status(500).json({

                message:
                    "Could not load submission."

            });

        }

    }

);


// =====================================================
// GET SINGLE SUBMISSION
// =====================================================

router.get(

    "/:id",

    async (req, res) => {

        try {

            const submission =
                await DocumentSubmission.findById(

                    req.params.id

                )

                .populate("learnerId")

                .populate("assignmentId");


            if (!submission) return res.status(404).json({ message: "Submission not found." });
            const assignment = await DocumentAssignment.findById(submission.assignmentId);
            const allowed = assignment && ((req.user.role === "learner" && String(submission.learnerId) === String(req.user.id)) || await tutorOwnsAssignment(req.user, assignment));
            if (!allowed) return res.status(403).json({ message: "You cannot access this submission." });

            res.json(

                submission

            );


        } catch (error) {

            console.log(

                "Get document submission error:",

                error

            );


            res.status(500).json({

                message:
                    "Could not load submission."

            });

        }

    }

);


// =====================================================
// MARK DOCUMENT SUBMISSION
// =====================================================

router.put(

    "/:id/mark",

    async (req, res) => {

        try {

            const {

                mark,

                feedback

            } = req.body;


            // =================================================
            // VALIDATION
            // =================================================

            if (
                mark === undefined ||
                mark === null
            ) {

                return res.status(400).json({

                    message:
                        "A mark is required."

                });

            }


            const numericMark =
                Number(mark);


            if (
                Number.isNaN(numericMark) ||
                numericMark < 0
            ) {

                return res.status(400).json({

                    message:
                        "Please enter a valid mark."

                });

            }


            // =================================================
            // FIND SUBMISSION
            // =================================================

            const submission =
                await DocumentSubmission.findById(

                    req.params.id

                );


            if (!submission) return res.status(404).json({ message: "Submission not found." });
            const assignment = await DocumentAssignment.findById(submission.assignmentId);
            if (!assignment || !(await tutorOwnsAssignment(req.user, assignment))) return res.status(403).json({ message: "You do not own this assignment." });


            if (numericMark > Number(assignment.totalMarks)) return res.status(400).json({ message: `Mark cannot exceed ${assignment.totalMarks}.` });

            // =================================================
            // SAVE MARK
            // =================================================

            submission.mark =
                numericMark;


            submission.feedback =
                typeof feedback === "string"

                    ? feedback

                    : "";


            submission.status =
                "Marked";
            submission.resultVisible = false;
            submission.resultVisibleAt = null;


            await submission.save();


            res.json(

                submission

            );


        } catch (error) {

            console.log(

                "Mark document submission error:",

                error

            );


            res.status(500).json({

                message:
                    "Could not mark submission.",

                error:
                    error.message

            });

        }

    }

);


// =====================================================
// UPLOAD MARKED DOCUMENT
// =====================================================

router.put(

    "/:id/marked-document",

    upload.single("markedDocument"),

    async (req, res) => {

        try {

            const submission =
                await DocumentSubmission.findById(

                    req.params.id

                );


            if (!submission) return res.status(404).json({ message: "Submission not found." });
            const assignment = await DocumentAssignment.findById(submission.assignmentId);
            if (!assignment || !(await tutorOwnsAssignment(req.user, assignment))) return res.status(403).json({ message: "You do not own this assignment." });

            if (!req.file) {

                return res.status(400).json({

                    message:
                        "Please upload the marked document."

                });

            }


            submission.markedDocument =
                req.file.path;


            await submission.save();


            res.json({

                message:
                    "Marked document uploaded successfully.",

                submission

            });


        } catch (error) {

            console.log(

                "Upload marked document error:",

                error

            );


            res.status(500).json({

                message:
                    "Could not upload marked document.",

                error:
                    error.message

            });

        }

    }

);



// Tutor-controlled visibility for document assignment results.
router.patch("/assignment/:assignmentId/visibility", async (req, res) => {
    try {
        if (!isTutor(req.user)) return res.status(403).json({ message: "Tutor access required." });
        const assignment = await DocumentAssignment.findById(req.params.assignmentId);
        if (!assignment) return res.status(404).json({ message: "Assignment not found." });
        if (!(await tutorOwnsAssignment(req.user, assignment))) return res.status(403).json({ message: "You do not own this assignment." });
        const visible = req.body.visible === true;
        const result = await DocumentSubmission.updateMany(
            { assignmentId: assignment._id, status: "Marked", mark: { $ne: null } },
            { $set: { resultVisible: visible, resultVisibleAt: visible ? new Date() : null } }
        );
        return res.json({ message: visible ? "Marked results released." : "Results hidden.", modifiedCount: result.modifiedCount });
    } catch (error) { return res.status(500).json({ message: "Could not update result visibility." }); }
});

router.patch("/:id/visibility", async (req, res) => {
    try {
        if (!isTutor(req.user)) return res.status(403).json({ message: "Tutor access required." });
        const submission = await DocumentSubmission.findById(req.params.id);
        if (!submission) return res.status(404).json({ message: "Submission not found." });
        const assignment = await DocumentAssignment.findById(submission.assignmentId);
        if (!assignment || !(await tutorOwnsAssignment(req.user, assignment))) return res.status(403).json({ message: "You do not own this assignment." });
        if (submission.status !== "Marked" || submission.mark === null || submission.mark === undefined) return res.status(400).json({ message: "Mark this submission before releasing its result." });
        submission.resultVisible = req.body.visible === true;
        submission.resultVisibleAt = submission.resultVisible ? new Date() : null;
        await submission.save();
        return res.json({ message: submission.resultVisible ? "Result released." : "Result hidden.", submission });
    } catch (error) { return res.status(500).json({ message: "Could not update result visibility." }); }
});

module.exports = router;