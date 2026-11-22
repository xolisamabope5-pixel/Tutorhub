const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
  senderRole: { type: String, enum: ["learner", "teacher", "owner", "admin"], required: true },
  body: { type: String, trim: true, maxlength: 5000, default: "" },
  attachmentUrl: { type: String, default: "" },
  attachmentName: { type: String, default: "" },
  attachmentMimeType: { type: String, default: "" },
  readBy: [{ type: mongoose.Schema.Types.ObjectId }],
  createdAt: { type: Date, default: Date.now }
}, { _id: true });

const conversationSchema = new mongoose.Schema({
  participants: [{ userId: { type: mongoose.Schema.Types.ObjectId, required: true }, role: { type: String, enum: ["learner", "teacher", "owner", "admin"], required: true } }],
  providerProgramId: { type: mongoose.Schema.Types.ObjectId, ref: "Program", default: null },
  messages: [messageSchema],
  lastMessageAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});
conversationSchema.index({ "participants.userId": 1, lastMessageAt: -1 });
module.exports = mongoose.model("Conversation", conversationSchema);
