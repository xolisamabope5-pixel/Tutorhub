const express = require("express");
const router = express.Router();

const Program = require("../models/Program");
const Tutor = require("../models/Tutor");
const Learner = require("../models/learner");
const Payment = require("../models/Payment");
const Class = require("../models/Class");
const Assignment = require("../models/Assignment");
const DocumentAssignment = require("../models/DocumentAssignment");
const Submission = require("../models/Submission");
const DocumentSubmission = require("../models/DocumentSubmission");
const AttendanceSession = require("../models/AttendanceSession");
const { authenticate, authorizeRoles } = require("../middleware/authMiddleware");

const requireOwner = [authenticate, authorizeRoles("owner")];
const requireProvider = [authenticate, authorizeRoles("teacher", "owner", "admin")];

function buildAssignmentMetric(assignment, classInfo, submissions, kind) {
    const totalMarks = Number(assignment.totalMarks) > 0
        ? Number(assignment.totalMarks)
        : (assignment.questions || []).reduce((sum, question) => sum + (Number(question.marks) || 0), 0);
    const marked = submissions.filter(item => item.mark !== null && item.mark !== undefined && item.status === "Marked");
    const averageMark = marked.length
        ? marked.reduce((sum, item) => sum + (Number(item.mark) || 0), 0) / marked.length
        : null;
    const averagePercentage = averageMark !== null && totalMarks > 0
        ? Math.max(0, Math.min(100, (averageMark / totalMarks) * 100))
        : null;

    return {
        id: String(assignment._id),
        createdAt: assignment.createdAt || null,
        title: assignment.title,
        className: classInfo?.className || "Class",
        subject: classInfo?.subject || "",
        grade: classInfo?.grade || "",
        kind,
        totalMarks,
        learnerCount: classInfo?.learners?.length || 0,
        submittedCount: submissions.length,
        markedCount: marked.length,
        averageMark: averageMark === null ? null : Number(averageMark.toFixed(2)),
        averagePercentage: averagePercentage === null ? null : Number(averagePercentage.toFixed(1))
    };
}


// Classroom reports: available to the independent tutor who owns the class,
// or the tuition-centre owner for any class belonging to their centre.
router.get("/class/:classId", ...requireProvider, async (req, res) => {
    try {
        const classroom = await Class.findById(req.params.classId)
            .select("_id tutorId programId className subject grade learners")
            .lean();
        if (!classroom) return res.status(404).json({ message: "Classroom not found." });

        let canView = req.user.role === "admin";
        if (!canView && req.user.role === "teacher") {
            canView = String(classroom.tutorId) === String(req.user.id);
        }
        if (!canView && req.user.role === "owner") {
            canView = String(classroom.tutorId) === String(req.user.id);
        }
        if (!canView) return res.status(403).json({ message: "You do not have access to reports for this classroom." });

        const [assignments, documentAssignments] = await Promise.all([
            Assignment.find({ classId: classroom._id }).lean(),
            DocumentAssignment.find({ classId: classroom._id }).lean()
        ]);
        const [submissions, documentSubmissions] = await Promise.all([
            Submission.find({ assignmentId: { $in: assignments.map(item => item._id) } }).lean(),
            DocumentSubmission.find({ assignmentId: { $in: documentAssignments.map(item => item._id) } }).lean()
        ]);

        const assignmentReports = [
            ...assignments.map(item => buildAssignmentMetric(
                item,
                classroom,
                submissions.filter(sub => String(sub.assignmentId) === String(item._id)),
                "Online assignment"
            )),
            ...documentAssignments.map(item => buildAssignmentMetric(
                item,
                classroom,
                documentSubmissions.filter(sub => String(sub.assignmentId) === String(item._id)),
                "Document assignment"
            ))
        ].sort((a, b) => (a.createdAt ? new Date(a.createdAt).getTime() : 0) - (b.createdAt ? new Date(b.createdAt).getTime() : 0));

        const markedAssignments = assignmentReports.filter(item => item.averagePercentage !== null);
        const classAveragePercentage = markedAssignments.length
            ? markedAssignments.reduce((sum, item) => sum + item.averagePercentage, 0) / markedAssignments.length
            : null;
        const attendanceSessions = await AttendanceSession.find({ classId: classroom._id, status: "Ended" }).lean();
        const enrolledLearners = await Learner.find({ _id: { $in: classroom.learners || [] } }).select("_id name surname").lean();
        const attendanceReports = enrolledLearners.map(learner => {
            let lessonsHeld = 0, attended = 0, totalMinutes = 0, absent = 0;
            for (const session of attendanceSessions) {
                lessonsHeld += 1;
                const entry = (session.entries || []).find(item => String(item.learnerId) === String(learner._id));
                const status = entry?.manualStatus || entry?.status || "Absent";
                if (["Present", "Late", "Partial", "Left early"].includes(status) && Number(entry?.totalSeconds) > 0) attended += 1; else absent += 1;
                totalMinutes += Math.round((Number(entry?.totalSeconds) || 0) / 60);
            }
            return { learnerId: String(learner._id), learnerName: `${learner.name || ""} ${learner.surname || ""}`.trim(), lessonsHeld, attended, absent, totalMinutes, attendancePercentage: lessonsHeld ? Number((attended / lessonsHeld * 100).toFixed(1)) : 0 };
        });

        res.json({
            classroom: {
                id: String(classroom._id),
                className: classroom.className,
                subject: classroom.subject,
                grade: classroom.grade,
                learnerCount: (classroom.learners || []).length
            },
            assignmentReports,
            attendanceReports,
            attendanceSessionCount: attendanceSessions.length,
            assignmentCount: assignmentReports.length,
            markedAssignmentCount: markedAssignments.length,
            classAveragePercentage: classAveragePercentage === null ? null : Number(classAveragePercentage.toFixed(1))
        });
    } catch (error) {
        console.error("Classroom reports error:", error);
        res.status(500).json({ message: "Could not generate classroom reports." });
    }
});

// Owner reports: centre activity, payments and marked assignment performance.
router.get("/owner/:id", ...requireOwner, async (req, res) => {
    try {
        // Never trust an owner ID supplied in the URL for access control.
        if (String(req.user.id) !== String(req.params.id)) {
            return res.status(403).json({ message: "You can only view reports for your own tuition centre." });
        }

        const program = await Program.findOne({ ownerId: req.user.id });
        if (!program) return res.status(404).json({ message: "Tuition centre not found" });

        const [tutors, learners, payments, classes] = await Promise.all([
            Tutor.find({ programId: program._id }).select("_id name surname"),
            Learner.find({ programId: program._id }).select("_id name surname grade"),
            Payment.find({ programId: program._id }).populate("learnerId", "name surname grade"),
            Class.find({ programId: program._id }).select("_id className subject grade learners tutorId")
        ]);

        const paidPayments = payments.filter(payment => payment.status === "Paid");
        const pendingPayments = payments.filter(payment => payment.status === "Pending");
        const revenue = paidPayments.reduce((total, payment) => total + (Number(payment.amount) || 0), 0);
        const classIds = classes.map(item => item._id);
        const ownerTaughtClassIds = classes.filter(item => String(item.tutorId) === String(req.user.id)).map(item => item._id);

        const [assignments, documentAssignments, attendanceSessions] = await Promise.all([
            Assignment.find({ classId: { $in: classIds } }).lean(),
            DocumentAssignment.find({ classId: { $in: classIds } }).lean(),
            AttendanceSession.find({ classId: { $in: ownerTaughtClassIds }, status: "Ended" }).populate("classId", "className").lean()
        ]);
        const [submissions, documentSubmissions] = await Promise.all([
            Submission.find({ assignmentId: { $in: assignments.map(item => item._id) } }).lean(),
            DocumentSubmission.find({ assignmentId: { $in: documentAssignments.map(item => item._id) } }).lean()
        ]);

        const classMap = new Map(classes.map(item => [String(item._id), item]));
        const assignmentReports = [
            ...assignments.map(item => buildAssignmentMetric(
                item,
                classMap.get(String(item.classId)),
                submissions.filter(sub => String(sub.assignmentId) === String(item._id)),
                "Online assignment"
            )),
            ...documentAssignments.map(item => buildAssignmentMetric(
                item,
                classMap.get(String(item.classId)),
                documentSubmissions.filter(sub => String(sub.assignmentId) === String(item._id)),
                "Document assignment"
            ))
        ].sort((a, b) => a.title.localeCompare(b.title));

        const assignmentsWithMarks = assignmentReports.filter(item => item.averagePercentage !== null);
        const centreAveragePercentage = assignmentsWithMarks.length
            ? assignmentsWithMarks.reduce((sum, item) => sum + item.averagePercentage, 0) / assignmentsWithMarks.length
            : null;

        const attendanceByLearner = new Map();
        for (const session of attendanceSessions) {
            const enrolledIds = (classMap.get(String(session.classId?._id || session.classId))?.learners || []).map(id => String(id));
            const entryMap = new Map((session.entries || []).map(entry => [String(entry.learnerId), entry]));
            for (const key of enrolledIds) {
                const entry = entryMap.get(key);
                const current = attendanceByLearner.get(key) || { learnerId: key, lessonsHeld: 0, attended: 0, absent: 0, totalMinutes: 0, learnerName: "Learner" };
                current.lessonsHeld += 1;
                const status = entry?.manualStatus || entry?.status || "Absent";
                if (["Present", "Late", "Partial", "Left early"].includes(status) && Number(entry?.totalSeconds) > 0) current.attended += 1;
                else current.absent += 1;
                current.totalMinutes += Math.round((Number(entry?.totalSeconds) || 0) / 60);
                attendanceByLearner.set(key, current);
            }
        }
        const learnerLookup = new Map(learners.map(l => [String(l._id), `${l.name || ""} ${l.surname || ""}`.trim()]));
        const attendanceReports = [...attendanceByLearner.values()].map(row => ({ ...row, learnerName: learnerLookup.get(row.learnerId) || row.learnerName, attendancePercentage: row.lessonsHeld ? Number((row.attended / row.lessonsHeld * 100).toFixed(1)) : 0 }));

        res.json({
            program,
            attendanceReports,
            attendanceSessionCount: attendanceSessions.length,
            totalTeachers: tutors.length,
            totalLearners: learners.length,
            paidPayments: paidPayments.length,
            pendingPayments: pendingPayments.length,
            revenue,
            payments,
            assignmentReports,
            assignmentCount: assignmentReports.length,
            markedAssignmentCount: assignmentsWithMarks.length,
            centreAveragePercentage: centreAveragePercentage === null ? null : Number(centreAveragePercentage.toFixed(1))
        });
    } catch (error) {
        console.error("Owner reports error:", error);
        res.status(500).json({ message: "Could not generate reports" });
    }
});

module.exports = router;
