const mongoose = require('mongoose');

// A push-notification token for one installed app (FCM registration token).
// Keyed by the token itself (unique) so re-registering the same device just
// refreshes it. `user` is who the device is currently signed in as, which is
// how a push is targeted to a person across their devices.
const deviceTokenSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  platform: { type: String, enum: ['ios', 'android', 'web'], default: 'android' },
  lastSeenAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Target all of a user's devices.
deviceTokenSchema.index({ user: 1 });

module.exports = mongoose.model('DeviceToken', deviceTokenSchema);
