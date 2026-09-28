const express = require("express");

const router = express.Router();

const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { v2: cloudinary } = require("cloudinary");

const DocumentSubmission =
    require("../models/DocumentSubmission");


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

    upload.array("files", 10),

    async (req, res) => {

        try {

            const {

                assignmentId,

                learnerId

            } = req.body;


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
                        "Submitted"

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

            const submission =
                await DocumentSubmission.findOne({

                    learnerId:
                        req.params.learnerId,

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


            res.json(

                submission

            );


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


            if (!submission) {

                return res.status(404).json({

                    message:
                        "Submission not found."

                });

            }


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


            if (!submission) {

                return res.status(404).json({

                    message:
                        "Submission not found."

                });

            }


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


            if (!submission) {

                return res.status(404).json({

                    message:
                        "Submission not found."

                });

            }


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


module.exports = router;