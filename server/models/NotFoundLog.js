const mongoose = require('mongoose');

const notFoundLogSchema = new mongoose.Schema({
  path: {
    type: String,
    required: true,
    index: true
  },
  referrer: {
    type: String,
    default: ''
  },
  userAgent: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 60 * 24 * 30 // Auto-delete documents after 30 days
  }
});

module.exports = mongoose.model('NotFoundLog', notFoundLogSchema);
