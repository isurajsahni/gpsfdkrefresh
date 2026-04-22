const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    index: true
  },
  email: {
    type: String,
    default: null
  },
  otp: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // Auto-delete document when expiresAt is reached
  }
}, { timestamps: true });

module.exports = mongoose.model('Otp', otpSchema);
