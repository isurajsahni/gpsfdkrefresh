const mongoose = require('mongoose');

/**
 * Multi-purpose OTP / verification session store.
 *
 * Replaces three in-memory Maps in authController.js
 * (emailOtpSessions, registrationOtpSessions, passwordlessOtpSessions)
 * so that:
 *   - sessions survive process restarts and multi-instance deploys
 *   - Mongo's TTL index automatically removes expired entries
 *   - registration data (password, name, phone) is no longer kept in process RAM
 *
 * The composite `key` is whatever the caller used as the Map key — for the
 * registration store this is the normalized email; for the email-update store
 * it's the userId; for passwordless it's the contact identifier.
 */
const otpSessionSchema = new mongoose.Schema({
  // Discriminator — "registration", "emailUpdate", "passwordless", etc.
  kind: { type: String, required: true, index: true },
  // Lookup key (email / userId / phone). Same shape the old Maps used.
  key: { type: String, required: true },
  // Arbitrary session payload (OTP, attempts, name/password for registration, etc.).
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  // TTL — Mongo removes the doc when this is reached.
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
}, { timestamps: true });

// Compound unique index so each (kind, key) is unique — emulates Map semantics.
otpSessionSchema.index({ kind: 1, key: 1 }, { unique: true });

module.exports = mongoose.model('OtpSession', otpSessionSchema);
