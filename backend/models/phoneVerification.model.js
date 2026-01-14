const mongoose = require('mongoose');

const phoneVerificationSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    index: true
  },
  otp: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  purpose: {
    type: String,
    enum: ['registration', 'update_phone'],
    required: true
  },
  verified: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 } // Auto-delete expired documents
  },
  attempts: {
    type: Number,
    default: 0,
    max: 5 // Max 5 verification attempts
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster lookups
phoneVerificationSchema.index({ phone: 1, verified: 1 });
phoneVerificationSchema.index({ userId: 1, purpose: 1 });

module.exports = mongoose.model('PhoneVerification', phoneVerificationSchema);







