const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  visitorId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  firstVisitAt: {
    type: Date,
    default: Date.now,
  },
  lastVisitAt: {
    type: Date,
    default: Date.now,
  },
  totalVisits: {
    type: Number,
    default: 1,
  },
  device: {
    type: String,
    default: '',
  },
  browser: {
    type: String,
    default: '',
  },
  ip: {
    type: String,
    default: '',
  },
  returning: {
    type: Boolean,
    default: false,
  },
  country: {
    type: String,
    default: '',
  },
  countryCode: {
    type: String,
    default: '',
  },
});

module.exports = mongoose.model('Visitor', visitorSchema);
