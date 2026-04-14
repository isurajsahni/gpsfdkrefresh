const mongoose = require('mongoose');

const pageViewSchema = new mongoose.Schema({
  visitorId: {
    type: String,
    required: true,
    index: true,
  },
  pageUrl: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  referrer: {
    type: String,
    default: '',
  },
  // UTM parameters
  utmSource: {
    type: String,
    default: '',
  },
  utmMedium: {
    type: String,
    default: '',
  },
  utmCampaign: {
    type: String,
    default: '',
  },
  utmTerm: {
    type: String,
    default: '',
  },
  utmContent: {
    type: String,
    default: '',
  },
  // Detected source (derived from UTM or referrer)
  source: {
    type: String,
    default: 'direct',
  },
});

// Compound index for efficient dashboard queries
pageViewSchema.index({ timestamp: -1, source: 1 });
pageViewSchema.index({ pageUrl: 1, timestamp: -1 });

module.exports = mongoose.model('PageView', pageViewSchema);
