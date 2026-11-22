const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Conversation = require("../models/Conversation");
const Learner = require("../models/learner");
const Tutor = require("../models/Tutor");
const Program = require("../models/Program");
const { authenticate } = require("../middleware/authMiddleware");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { v2: cloudinary } = require("cloudinary");

cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "tutorhub/inbox",
    resource_type: "auto",
    allowed_formats: ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv", "zip", "jpg", "jpeg", "png", "gif", "webp"]
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain", "text/csv", "application/zip", "application/x-zip-compressed",
      "image/jpeg", "image/png", "image/gif", "image/webp"
    ];
    cb(allowed.includes(file.mimetype) ? null : new Error("Supported attachments: images, PDF, Word, Excel, PowerPoint, TXT, CSV and ZIP (max 12 MB)."), allowed.includes(file.mimetype));
  }
});

router.use(authenticate);
const idOf = value => String(value || "");
const roles = ["learner", "teacher", "owner", "admin"];

async function canContact(a, b) {
  if (a.role === "admin" || b.role === "admin") return true;
  if (a.role === "learner") {
    const learner = await Learner.findById(a.userId).select("programId tutorId");
    if (!learner) return false;
    if (["teacher", "owner"].includes(b.role)) {
      const tutor = await Tutor.findById(b.userId).select("programId role");
      if (!tutor) return false;
      if (idOf(learner.tutorId) === idOf(tutor._id)) return true;
      if (idOf(learner.programId) && idOf(learner.programId) === idOf(tutor.programId)) return true;
      const program = learner.programId ? await Program.findById(learner.programId).select("ownerId") : null;
      return !!program && idOf(program.ownerId) === idOf(tutor._id);
    }
  }
  if (["teacher", "owner"].includes(a.role) && b.role === "learner") return canContact(b, a);
  if (["teacher", "owner"].includes(a.role) && ["teacher", "owner"].includes(b.role)) {
    const [ta, tb] = await Promise.all([Tutor.findById(a.userId).select("programId role"), Tutor.findById(b.userId).select("programId role")]);
    if (!ta || !tb) return false;
    if (idOf(ta._id) === idOf(tb._id)) return false;
    return !!ta.programId && idOf(ta.programId) === idOf(tb.programId);
  }
  return false;
}

router.get("/contacts", async (req, res) => {
  try {
    const { id, role } = req.user;
    let contacts = [];
    if (role === "learner") {
      const learner = await Learner.findById(id).select("programId tutorId");
      if (!learner) return res.status(404).json({ message: "Account not found" });
      const ids = [learner.tutorId].filter(Boolean);
      const program = learner.programId ? await Program.findById(learner.programId).select("ownerId") : null;
      if (program?.ownerId) ids.push(program.ownerId);
      contacts = await Tutor.find({ _id: { $in: ids } }).select("name surname businessName role").lean();
      contacts = contacts.map(x => ({ ...x, userId: x._id, role: x.role === "owner" ? "owner" : "teacher" }));
    } else if (["teacher", "owner"].includes(role)) {
      const tutor = await Tutor.findById(id).select("programId role");
      if (!tutor) return res.status(404).json({ message: "Account not found" });
      const filter = role === "owner" ? { programId: tutor.programId } : { tutorId: tutor._id };
      const learners = await Learner.find(filter).select("name surname grade").lean();
      contacts = learners.map(x => ({ ...x, userId: x._id, role: "learner" }));
      if (tutor.programId) {
        if (role === "owner") {
          const staff = await Tutor.find({ programId: tutor.programId, _id: { $ne: tutor._id } }).select("name surname businessName role").lean();
          contacts.push(...staff.map(x => ({ ...x, userId: x._id, role: "teacher" })));
        } else {
          const program = await Program.findById(tutor.programId).select("ownerId");
          if (program?.ownerId) {
            const owner = await Tutor.findById(program.ownerId).select("name surname businessName").lean();
            if (owner) contacts.push({ ...owner, userId: owner._id, role: "owner" });
          }
        }
      }
    } else if (role === "admin") {
      const providers = await Tutor.find({ role: { $in: ["owner", "teacher"] } }).select("name surname businessName role").lean();
      contacts = providers.map(x => ({ ...x, userId: x._id, role: x.role }));
    }
    res.json({ contacts });
  } catch (e) { res.status(500).json({ message: "Could not load contacts" }); }
});

router.get("/conversations", async (req, res) => {
  try {
    const rows = await Conversation.find({ "participants.userId": req.user.id }).sort({ lastMessageAt: -1 }).lean();
    res.json({ conversations: rows.map(c => ({ ...c, messages: c.messages.slice(-1) })) });
  } catch (e) { res.status(500).json({ message: "Could not load inbox" }); }
});

router.post("/conversations", async (req, res) => {
  try {
    const target = { userId: req.body.userId, role: req.body.role };
    if (!mongoose.isValidObjectId(target.userId) || !roles.includes(target.role) || target.role === req.user.role) return res.status(400).json({ message: "Choose a valid contact" });
    const self = { userId: req.user.id, role: req.user.role };
    if (!(await canContact(self, target))) return res.status(403).json({ message: "You cannot message this account" });
    let conversation = await Conversation.findOne({ $and: [{ participants: { $elemMatch: { userId: self.userId, role: self.role } } }, { participants: { $elemMatch: { userId: target.userId, role: target.role } } }] });
    if (!conversation) {
      const learner = self.role === "learner" ? await Learner.findById(self.userId).select("programId") : target.role === "learner" ? await Learner.findById(target.userId).select("programId") : null;
      conversation = await Conversation.create({ participants: [self, target], providerProgramId: learner?.programId || null });
    }
    res.status(201).json({ conversation });
  } catch (e) { res.status(500).json({ message: "Could not start conversation" }); }
});

router.get("/conversations/:id", async (req, res) => {
  try {
    const conversation = await Conversation.findOne({ _id: req.params.id, "participants.userId": req.user.id });
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });
    res.json({ conversation });
  } catch (e) { res.status(500).json({ message: "Could not load conversation" }); }
});

router.post("/conversations/:id/messages", upload.single("attachment"), async (req, res) => {
  try {
    const body = String(req.body.body || "").trim();
    if (!body && !req.file) return res.status(400).json({ message: "Write a message or attach a file." });
    if (body.length > 5000) return res.status(400).json({ message: "Messages must be 5,000 characters or fewer." });
    const conversation = await Conversation.findOne({ _id: req.params.id, "participants.userId": req.user.id });
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });
    conversation.messages.push({
      senderId: req.user.id,
      senderRole: req.user.role,
      body,
      attachmentUrl: req.file ? (req.file.path || req.file.secure_url || "") : "",
      attachmentName: req.file ? req.file.originalname : "",
      attachmentMimeType: req.file ? req.file.mimetype : "",
      readBy: [req.user.id]
    });
    conversation.lastMessageAt = new Date();
    await conversation.save();
    res.status(201).json({ message: conversation.messages[conversation.messages.length - 1] });
  } catch (e) {
    res.status(400).json({ message: e.message || "Message could not be sent" });
  }
});

router.patch("/conversations/:id/read", async (req, res) => {
  try {
    const conversation = await Conversation.findOne({ _id: req.params.id, "participants.userId": req.user.id });
    if (!conversation) return res.status(404).json({ message: "Conversation not found" });
    conversation.messages.forEach(m => { if (!m.readBy.some(x => idOf(x) === idOf(req.user.id))) m.readBy.push(req.user.id); });
    await conversation.save(); res.json({ success: true });
  } catch (e) { res.status(500).json({ message: "Could not update read status" }); }
});
module.exports = router;
