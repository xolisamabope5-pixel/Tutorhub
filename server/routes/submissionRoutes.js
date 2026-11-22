const express = require("express");

const router = express.Router();

const Submission = require("../models/Submission");
const Assignment = require("../models/Assignment");
const Class = require("../models/Class");
const { authenticate, authorizeRoles } = require("../middleware/authMiddleware");

const requireTutorOwner = [authenticate, authorizeRoles("teacher", "owner", "admin")];
const requireLearnerUser = [authenticate, authorizeRoles("learner")];

async function tutorOwnsAssignment(user, assignment) {
    if (!user || !assignment) return false;
    if (user.role === "admin") return true;
    return String(assignment.tutorId) === String(user.id);
}

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


        if (!assignmentId || !learnerId) return res.status(400).json({ message: "Assignment and learner information are required." });

        // Submission is open without requiring a learner login. The learner ID
        // must still belong to the assignment classroom before work is accepted.

        const assignment = await Assignment.findById(assignmentId);
        if (!assignment) return res.status(404).json({ message: "Assignment not found." });
        const classroom = await Class.findById(assignment.classId).select("learners");
        if (!classroom || !(classroom.learners || []).some(id => String(id) === String(learnerId))) {
            return res.status(403).json({ message: "You are not enrolled in this assignment classroom." });
        }

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
// ASSIGNMENT PERFORMANCE ANALYTICS
// Average learner performance + questions needing attention.
// This endpoint intentionally returns aggregate learner data only.
// =============================================
router.get("/analytics/assignment/:assignmentId", ...requireTutorOwner, async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.assignmentId).lean();
        if (!assignment) {
            return res.status(404).json({ message: "Assignment not found" });
        }
        if (!(await tutorOwnsAssignment(req.user, assignment))) return res.status(403).json({ message: "You do not own this assignment." });

        const classroom = await Class.findById(assignment.classId)
            .select("className subject grade learners")
            .populate("learners", "name surname")
            .lean();
        const submissions = await Submission.find({ assignmentId: assignment._id })
            .populate("learnerId", "name surname")
            .lean();

        const marked = submissions.filter(s => s.mark !== null && s.mark !== undefined && s.status === "Marked");
        const possibleMarks = (assignment.questions || []).reduce((sum, q) => sum + (Number(q.marks) || 0), 0);
        const averageMark = marked.length
            ? marked.reduce((sum, s) => sum + (Number(s.mark) || 0), 0) / marked.length
            : null;
        const averagePercentage = averageMark !== null && possibleMarks > 0
            ? (averageMark / possibleMarks) * 100
            : null;

        const questionAnalysis = (assignment.questions || []).map((question, index) => {
            const questionMax = Number(question.marks) || 0;
            const scored = marked.map(submission => {
                const answer = (submission.answers || []).find(a => String(a.questionId) === String(question._id));
                return answer && answer.marks !== null && answer.marks !== undefined ? Number(answer.marks) : null;
            }).filter(mark => mark !== null && Number.isFinite(mark));
            const avgMark = scored.length ? scored.reduce((sum, mark) => sum + mark, 0) / scored.length : null;
            const avgPercentage = avgMark !== null && questionMax > 0 ? (avgMark / questionMax) * 100 : null;
            const fullCreditCount = scored.filter(mark => questionMax > 0 && mark >= questionMax).length;
            const attentionNeeded = avgPercentage !== null && avgPercentage < 60;
            return {
                questionId: question._id,
                questionNumber: index + 1,
                questionText: question.questionText,
                maximumMarks: questionMax,
                averageMark: avgMark === null ? null : Number(avgMark.toFixed(2)),
                averagePercentage: avgPercentage === null ? null : Number(avgPercentage.toFixed(1)),
                fullCreditCount,
                markedResponses: scored.length,
                attentionNeeded,
                attentionReason: attentionNeeded ? "Average score is below 60%" : null
            };
        });

        const learnerCount = classroom?.learners?.length || 0;
        res.json({
            assignment: {
                id: assignment._id,
                title: assignment.title,
                totalMarks: possibleMarks,
                className: classroom?.className || "",
                subject: classroom?.subject || "",
                grade: classroom?.grade || ""
            },
            summary: {
                learnerCount,
                submittedCount: submissions.length,
                markedCount: marked.length,
                pendingMarkingCount: submissions.length - marked.length,
                notSubmittedCount: Math.max(0, learnerCount - submissions.length),
                averageMark: averageMark === null ? null : Number(averageMark.toFixed(2)),
                averagePercentage: averagePercentage === null ? null : Number(averagePercentage.toFixed(1)),
                highestMark: marked.length ? Math.max(...marked.map(s => Number(s.mark) || 0)) : null,
                lowestMark: marked.length ? Math.min(...marked.map(s => Number(s.mark) || 0)) : null
            },
            questionAnalysis,
            outstandingLearners: (classroom?.learners || []).filter(person =>
                !submissions.some(submission => String(submission.learnerId?._id || submission.learnerId) === String(person._id))
            ).map(person => ({ _id: person._id, name: person.name, surname: person.surname })),
            submissions: submissions.map(s => ({
                _id: s._id,
                learner: s.learnerId ? {
                    _id: s.learnerId._id,
                    name: s.learnerId.name,
                    surname: s.learnerId.surname
                } : null,
                status: s.status,
                resultVisible: s.resultVisible === true,
                mark: s.mark,
                percentage: s.mark !== null && s.mark !== undefined && possibleMarks > 0
                    ? Number(((Number(s.mark) / possibleMarks) * 100).toFixed(1)) : null,
                submittedAt: s.createdAt
            }))
        });
    } catch (error) {
        console.error("Assignment analytics error:", error);
        res.status(500).json({ message: "Could not load assignment analytics" });
    }
});



// Tutor controls result release. Bulk release applies only to marked submissions.
router.patch("/assignment/:assignmentId/visibility", ...requireTutorOwner, async (req, res) => {
    try {
        const { visible } = req.body;
        if (typeof visible !== "boolean") return res.status(400).json({ message: "visible must be true or false" });
        const assignment = await Assignment.findById(req.params.assignmentId);
        if (!assignment) return res.status(404).json({ message: "Assignment not found" });
        if (!(await tutorOwnsAssignment(req.user, assignment))) return res.status(403).json({ message: "You do not own this assignment." });
        const result = await Submission.updateMany(
            { assignmentId: assignment._id, status: "Marked", mark: { $ne: null } },
            { $set: { resultVisible: visible, resultVisibleAt: visible ? new Date() : null } }
        );
        res.json({ message: visible ? "Marked results released to learners." : "Results hidden from learners.", updatedCount: result.modifiedCount ?? result.nModified ?? 0 });
    } catch (error) {
        console.error("Bulk result visibility error:", error);
        res.status(500).json({ message: "Could not update result visibility" });
    }
});

// Tutor can release or hide one learner's marked result.
router.patch("/:id/visibility", ...requireTutorOwner, async (req, res) => {
    try {
        const { visible } = req.body;
        if (typeof visible !== "boolean") return res.status(400).json({ message: "visible must be true or false" });
        const submission = await Submission.findById(req.params.id);
        if (!submission) return res.status(404).json({ message: "Submission not found" });
        const assignment = await Assignment.findById(submission.assignmentId);
        if (!(await tutorOwnsAssignment(req.user, assignment))) return res.status(403).json({ message: "You do not own this submission." });
        if (submission.status !== "Marked" || submission.mark === null) return res.status(409).json({ message: "Mark this submission before releasing its result." });
        submission.resultVisible = visible;
        submission.resultVisibleAt = visible ? new Date() : null;
        await submission.save();
        res.json({ message: visible ? "Result released." : "Result hidden.", submission });
    } catch (error) {
        console.error("Result visibility error:", error);
        res.status(500).json({ message: "Could not update result visibility" });
    }
});

// Learners only receive their own results after the tutor releases them.
router.get("/results/learner/:learnerId", ...requireLearnerUser, async (req, res) => {
    try {
        if (String(req.user.id) !== String(req.params.learnerId)) return res.status(403).json({ message: "You can only view your own results." });
        const results = await Submission.find({ learnerId: req.params.learnerId, status: "Marked", resultVisible: true, mark: { $ne: null } })
            .populate("assignmentId", "title totalMarks dueDate classId")
            .sort({ updatedAt: -1 }).lean();
        res.json(results);
    } catch (error) {
        console.error("Learner results error:", error);
        res.status(500).json({ message: "Could not load results" });
    }
});

// =============================================
// GET ALL SUBMISSIONS FOR ASSIGNMENT
// =============================================

router.get(
    "/assignment/:assignmentId",
    ...requireTutorOwner,
    async (req, res) => {

        try {

            const assignment = await Assignment.findById(req.params.assignmentId);
            if (!assignment) return res.status(404).json({ message: "Assignment not found" });
            if (!(await tutorOwnsAssignment(req.user, assignment))) return res.status(403).json({ message: "You do not own this assignment." });

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
    ...requireLearnerUser,
    async (req, res) => {

        try {
            if (String(req.user.id) !== String(req.params.learnerId)) return res.status(403).json({ message: "You can only view your own submission." });

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
    ...requireTutorOwner,
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

            const assignment = await Assignment.findById(submission.assignmentId);
            if (!(await tutorOwnsAssignment(req.user, assignment))) return res.status(403).json({ message: "You do not own this submission." });
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

router.put("/:id", ...requireTutorOwner, async (req, res) => {
    try {
        const { marks, feedback } = req.body;
        if (!Array.isArray(marks)) {
            return res.status(400).json({ message: "Marks must be provided as an array." });
        }

        const submission = await Submission.findById(req.params.id);
        if (!submission) return res.status(404).json({ message: "Submission not found" });

        const assignment = await Assignment.findById(submission.assignmentId);
        if (!assignment) return res.status(404).json({ message: "Related assignment not found" });
        if (!(await tutorOwnsAssignment(req.user, assignment))) return res.status(403).json({ message: "You do not own this assignment." });
        if (marks.length !== submission.answers.length) {
            return res.status(400).json({ message: "A mark is required for every submitted answer." });
        }

        let totalMark = 0;
        for (let index = 0; index < submission.answers.length; index += 1) {
            const answer = submission.answers[index];
            const question = assignment.questions.find(q => String(q._id) === String(answer.questionId));
            if (!question) return res.status(400).json({ message: `Question ${index + 1} no longer exists in this assignment.` });

            const awarded = Number(marks[index]);
            const maximum = Number(question.marks) || 0;
            if (!Number.isFinite(awarded) || awarded < 0 || awarded > maximum) {
                return res.status(400).json({ message: `Question ${index + 1} must be marked between 0 and ${maximum}.` });
            }
            answer.marks = awarded;
            answer.correct = maximum > 0 ? awarded >= maximum : awarded > 0;
            totalMark += awarded;
        }

        submission.mark = Number(totalMark.toFixed(2));
        submission.feedback = typeof feedback === "string" ? feedback.trim() : "";
        submission.status = "Marked";
        submission.resultVisible = false;
        submission.resultVisibleAt = null;
        await submission.save();

        const populated = await Submission.findById(submission._id)
            .populate("learnerId")
            .populate("assignmentId");
        res.json(populated);
    } catch (error) {
        console.error("Save marks error:", error);
        res.status(500).json({ message: "Could not save marks" });
    }
});module.exports = router;