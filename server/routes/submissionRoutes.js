const express = require("express");

const router = express.Router();

const Submission = require("../models/Submission");

// =============================================
// CREATE / UPDATE SUBMISSION
// =============================================

router.post("/create", async (req, res) => {

    try {

        const {
            assignmentId,
            learnerId,
            answers
        } = req.body;


        // =============================================
        // VALIDATION
        // =============================================

        if (!assignmentId || !learnerId) {

            return res.status(400).json({
                message:
                    "Assignment and learner information are required."
            });

        }


        if (!Array.isArray(answers)) {

            return res.status(400).json({
                message:
                    "Answers must be provided."
            });

        }


        // =============================================
        // CLEAN ANSWERS
        // =============================================

        const cleanedAnswers = answers.map((item) => ({

            questionId: item.questionId,

            answer:
                typeof item.answer === "string"
                    ? item.answer.trim()
                    : "",

            marks: null,

            correct: null

        }));


        // =============================================
        // CHECK EXISTING SUBMISSION
        // =============================================

        const existingSubmission =
            await Submission.findOne({
                assignmentId,
                learnerId
            });


        // =============================================
        // EXISTING SUBMISSION
        // =============================================

        if (existingSubmission) {

            if (
                existingSubmission.mark !== null &&
                existingSubmission.mark !== undefined
            ) {

                return res.status(400).json({
                    message:
                        "This assignment has already been marked and cannot be changed."
                });

            }


            existingSubmission.answers =
                cleanedAnswers;

            existingSubmission.status =
                "Submitted";


            await existingSubmission.save();


            return res.json(
                existingSubmission
            );

        }


        // =============================================
        // CREATE NEW SUBMISSION
        // =============================================

        const submission =
            new Submission({

                assignmentId,

                learnerId,

                answers:
                    cleanedAnswers,

                mark: null,

                feedback: "",

                status: "Submitted"

            });


        await submission.save();


        res.status(201).json(
            submission
        );


    } catch (error) {

        console.log(
            "Create submission error:",
            error
        );


        res.status(500).json({
            message:
                "Could not create submission."
        });

    }

});


// =============================================
// GET ALL SUBMISSIONS FOR ASSIGNMENT
// =============================================

router.get(
    "/assignment/:assignmentId",
    async (req, res) => {

        try {

            const submissions =
                await Submission.find({

                    assignmentId:
                        req.params.assignmentId

                })
                .populate("learnerId")
                .populate("assignmentId");


            res.json(submissions);


        } catch (error) {

            console.log(error);


            res.status(500).json({
                message:
                    "Server error"
            });

        }

    }
);


// =============================================
// GET LEARNER SUBMISSION
// =============================================

router.get(
    "/learner/:learnerId/:assignmentId",
    async (req, res) => {

        try {

            const submission =
                await Submission.findOne({

                    learnerId:
                        req.params.learnerId,

                    assignmentId:
                        req.params.assignmentId

                })
                .populate("assignmentId");


            if (!submission) {

                return res.status(404).json({
                    message:
                        "No submission found"
                });

            }


            res.json(submission);


        } catch (error) {

            console.log(
                "Get learner submission error:",
                error
            );


            res.status(500).json({
                message:
                    "Server error"
            });

        }

    }
);


// =============================================
// GET SINGLE SUBMISSION
// =============================================

router.get(
    "/:id",
    async (req, res) => {

        try {

            const submission =
                await Submission.findById(
                    req.params.id
                )
                .populate("learnerId")
                .populate("assignmentId");


            if (!submission) {

                return res.status(404).json({
                    message:
                        "Submission not found"
                });

            }


            res.json(submission);


        } catch (error) {

            console.log(error);


            res.status(500).json({
                message:
                    "Server error"
            });

        }

    }
);


// =============================================
// SAVE MARKS + QUESTION RESULTS + FEEDBACK
// =============================================

router.put(
    "/:id",
    async (req, res) => {

        try {

            const {
                marks,
                totalMark,
                feedback
            } = req.body;


            // =============================================
            // VALIDATE MARKS ARRAY
            // =============================================

            if (!Array.isArray(marks)) {

                return res.status(400).json({
                    message:
                        "Marks must be provided as an array."
                });

            }


            // =============================================
            // FIND SUBMISSION
            // =============================================

            const submission =
                await Submission.findById(
                    req.params.id
                );


            if (!submission) {

                return res.status(404).json({
                    message:
                        "Submission not found"
                });

            }


            // =============================================
            // SAVE QUESTION-BY-QUESTION MARKS
            // =============================================

            submission.answers =
                submission.answers.map(
                    (answer, index) => {

                        const questionMark =
                            Number(
                                marks[index] ?? 0
                            );


                        answer.marks =
                            questionMark;


                        // =============================================
                        // CORRECT / WRONG
                        //
                        // If learner receives full marks
                        // for the question = Correct.
                        //
                        // Anything less = Wrong.
                        // =============================================

                        const assignment =
                            submission.assignmentId;


                        const question =
                            assignment?.questions?.find(
                                (q) =>
                                    String(q._id) ===
                                    String(answer.questionId)
                            );


                        const questionMaxMarks =
                            Number(
                                question?.marks ?? 0
                            );


                        answer.correct =
                            questionMaxMarks > 0
                                ? questionMark ===
                                  questionMaxMarks
                                : questionMark > 0;


                        return answer;

                    }
                );


            // =============================================
            // SAVE TOTAL MARK
            // =============================================

            submission.mark =
                Number(
                    totalMark ?? 0
                );


            // =============================================
            // SAVE FEEDBACK
            // =============================================

            submission.feedback =
                typeof feedback === "string"
                    ? feedback
                    : "";


            // =============================================
            // UPDATE STATUS
            // =============================================

            submission.status =
                "Marked";


            // =============================================
            // SAVE EVERYTHING
            // =============================================

            await submission.save();


            // =============================================
            // RETURN UPDATED SUBMISSION
            // =============================================

            res.json(
                submission
            );


        } catch (error) {

            console.log(
                "Save marks error:",
                error
            );


            res.status(500).json({
                message:
                    "Could not save marks"
            });

        }

    }
);


module.exports = router;