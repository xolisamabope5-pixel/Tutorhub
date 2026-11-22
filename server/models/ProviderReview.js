const mongoose = require('mongoose');

const providerReviewSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tutor', required: true },
  programId: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', default: null },
  action: { type: String, enum: ['approved', 'rejected', 'blocked', 'unblocked', 'payment-verified'], required: true },
  paymentVerified: { type: Boolean, default: false },
  note: { type: String, trim: true, maxlength: 1000, default: '' },
  previousStatus: { type: String, default: '' },
  newStatus: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('ProviderReview', providerReviewSchema);
