const mongoose = require('mongoose');

// Marketing-authored messages surfaced in the app's notification inbox
// ("New launches", offers, general updates). The inbox previously had no
// backend to drive it, so marketing had no way to push anything to the app.
const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 140 },
  body: { type: String, required: true, trim: true, maxlength: 2000 },
  // Optional hero image for the inbox card.
  image: { type: String, default: '' },
  // Optional destination when the card is tapped — a deep link or URL
  // (e.g. a collection or product page).
  link: { type: String, default: '' },
  type: { type: String, enum: ['launch', 'offer', 'update', 'general'], default: 'general' },
  isActive: { type: Boolean, default: true },
  // Schedule window. publishAt lets marketing prepare a launch ahead of time;
  // expiresAt (optional) drops it from the feed automatically.
  publishAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Public feed query: active, already-published, not-yet-expired, newest first.
announcementSchema.index({ isActive: 1, publishAt: -1 });

module.exports = mongoose.model('Announcement', announcementSchema);
