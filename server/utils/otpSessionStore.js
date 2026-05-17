/**
 * Map-like async store backed by the OtpSession Mongo collection.
 *
 * Drop-in replacement for the in-memory Maps that authController.js used to
 * keep OTPs in process RAM. Each store has its own `kind`, so they don't
 * interfere with each other.
 *
 *   const reg = createOtpStore('registration', 10 * 60 * 1000);
 *   await reg.set(email, { otp, attempts: 0, sentAt: Date.now() });
 *   const sess = await reg.get(email);
 *   await reg.delete(email);
 *
 * Why this matters:
 *  - sessions survive deploys / dyno restarts
 *  - work across multiple instances (Render autoscale)
 *  - Mongo TTL auto-purges expired entries (no setInterval needed)
 *  - removes plaintext passwords from process memory after process death
 */
const OtpSession = require('../models/OtpSession');

function createOtpStore(kind, expiryMs) {
  if (!kind || typeof kind !== 'string') {
    throw new Error('createOtpStore: `kind` is required');
  }
  if (!Number.isFinite(expiryMs) || expiryMs <= 0) {
    throw new Error('createOtpStore: `expiryMs` must be > 0');
  }

  return {
    /** Read a session by key. Returns null when absent or expired. */
    async get(key) {
      if (!key) return null;
      const doc = await OtpSession.findOne({ kind, key: String(key) }).lean();
      if (!doc) return null;
      // Defense in depth — TTL may not have fired yet on Mongo, so verify.
      if (doc.expiresAt && doc.expiresAt.getTime() < Date.now()) return null;
      return doc.data || null;
    },

    /** Upsert a session and reset its expiry to now + expiryMs. */
    async set(key, data) {
      if (!key) throw new Error('otpStore.set: key required');
      const expiresAt = new Date(Date.now() + expiryMs);
      await OtpSession.findOneAndUpdate(
        { kind, key: String(key) },
        { kind, key: String(key), data, expiresAt },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    },

    /** Remove a session. No-op if absent. */
    async delete(key) {
      if (!key) return;
      await OtpSession.deleteOne({ kind, key: String(key) });
    },
  };
}

module.exports = { createOtpStore };
