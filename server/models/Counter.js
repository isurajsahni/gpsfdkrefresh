const mongoose = require('mongoose');

// Named monotonic counters. Used for GST invoice numbers, which must be a
// consecutive series per financial year — an ObjectId or timestamp can't give
// that. `_id` is the series name (e.g. "invoice-2026-27").
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

// Atomically bump and return the next value; creates the series at 1.
counterSchema.statics.next = async function (name) {
  const doc = await this.findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return doc.seq;
};

module.exports = mongoose.model('Counter', counterSchema);
