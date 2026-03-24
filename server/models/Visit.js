const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true,
    unique: true
  },
  count: {
    type: Number,
    default: 0
  },
  visitors: {
    type: Number,
    default: 0
  },
  countries: [{
    name: { type: String },
    code: { type: String },
    count: { type: Number, default: 0 }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Visit', visitSchema);
