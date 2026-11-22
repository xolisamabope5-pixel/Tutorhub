const mongoose = require("mongoose");

const notificationStateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  role: { type: String, required: true, index: true },
  lastSeenAt: { type: Date, default: null }
}, { timestamps: true });

notificationStateSchema.index({ userId: 1, role: 1 }, { unique: true });
module.exports = mongoose.model("NotificationState", notificationStateSchema);
