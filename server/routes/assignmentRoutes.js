const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Assignment = require("../models/Assignment");
const Class = require("../models/Class");
const { authenticate } = require("../middleware/authMiddleware");

router.use(authenticate);
const isTutor = (u) => ["teacher", "owner", "admin"].includes(u?.role);
const isAdmin = (u) => u?.role === "admin";
async function canAccessClass(user, classId) {
  const cls = await Class.findById(classId);
  if (!cls) return { cls: null, allowed: false };
  const allowed = isAdmin(user) ||
    (isTutor(user) && String(cls.tutorId) === String(user.id)) ||
    (user.role === "learner" && (cls.learners || []).some(id => String(id) === String(user.id)));
  return { cls, allowed };
}

router.post("/create", async (req, res) => {
  try {
    if (!isTutor(req.user)) return res.status(403).json({ message: "Tutor access required." });
    const { classId, title, description, dueDate, totalMarks, attachment, questions } = req.body;
    if (!classId || !title?.trim() || !dueDate || !Number.isFinite(Number(totalMarks)) || Number(totalMarks) <= 0)
      return res.status(400).json({ message: "Class, title, due date and a positive total mark are required." });
    const { cls, allowed } = await canAccessClass(req.user, classId);
    if (!cls) return res.status(404).json({ message: "Classroom not found." });
    if (!allowed) return res.status(403).json({ message: "You do not own this classroom." });
    const assignment = await Assignment.create({ classId, tutorId: req.user.id, title: title.trim(), description: description || "", dueDate, totalMarks: Number(totalMarks), attachment, questions: Array.isArray(questions) ? questions : [] });
    return res.status(201).json({ message: "Assignment created successfully", assignment });
  } catch (error) { return res.status(500).json({ message: error.message }); }
});

router.get("/class/:id", async (req, res) => {
  try {
    const { cls, allowed } = await canAccessClass(req.user, req.params.id);
    if (!cls) return res.status(404).json({ message: "Classroom not found." });
    if (!allowed) return res.status(403).json({ message: "You are not enrolled in or assigned to this classroom." });
    const assignments = await Assignment.find({ classId: req.params.id }).sort({ createdAt: -1 });
    return res.json(assignments);
  } catch (error) { return res.status(500).json({ message: error.message }); }
});

router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid assignment ID." });
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: "Assignment not found" });
    const { allowed } = await canAccessClass(req.user, assignment.classId);
    if (!allowed) return res.status(403).json({ message: "You cannot access this assignment." });
    return res.json(assignment);
  } catch (error) { return res.status(500).json({ message: error.message }); }
});

router.delete("/:id", async (req, res) => {
  try {
    if (!isTutor(req.user)) return res.status(403).json({ message: "Tutor access required." });
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ message: "Assignment not found" });
    if (!isAdmin(req.user) && String(assignment.tutorId) !== String(req.user.id)) return res.status(403).json({ message: "You do not own this assignment." });
    await Assignment.findByIdAndDelete(req.params.id);
    return res.json({ message: "Assignment deleted successfully." });
  } catch (error) { return res.status(500).json({ message: "Could not delete assignment", error: error.message }); }
});
module.exports = router;
