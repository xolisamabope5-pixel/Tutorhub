const mongoose = require('mongoose');
const attendanceEntrySchema = new mongoose.Schema({
  learnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Learner', required: true },
  periods: [{ joinedAt: { type: Date, required: true }, leftAt: { type: Date, default: null } }],
  totalSeconds: { type: Number, default: 0 },
  status: { type: String, enum: ['Present','Late','Partial','Absent','Left early'], default: 'Absent' },
  manualStatus: { type: String, default: null },
  correctionNote: { type: String, default: '' }
}, { _id: true });
const schema = new mongoose.Schema({
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true, index: true },
  tutorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tutor', required: true },
  title: { type: String, default: 'Live lesson' },
  scheduledStart: { type: Date, default: Date.now },
  scheduledDurationMinutes: { type: Number, default: 60, min: 1 },
  thresholdPercent: { type: Number, default: 75, min: 1, max: 100 },
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date, default: null },
  status: { type: String, enum: ['Live','Ended'], default: 'Live' },
  entries: [attendanceEntrySchema]
}, { timestamps: true });
module.exports = mongoose.model('AttendanceSession', schema);
