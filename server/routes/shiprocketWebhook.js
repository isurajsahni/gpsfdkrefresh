/**
 * Shiprocket Tracking Webhook Route
 *
 * GET  /api/webhook/tracking → Health check (Shiprocket verifies URL is live)
 * POST /api/webhook/tracking → Handles tracking status updates
 *
 * AUTH MODEL (read this before changing the controller):
 * Every POST must carry an `x-api-key` header that matches
 * `SHIPROCKET_WEBHOOK_SECRET` (or legacy `VERIFY_TOKEN`). The check happens
 * in `validateApiKey` below — by the time the controller runs, the request
 * has already been authenticated. Shiprocket doesn't sign payloads with
 * HMAC, so a shared static secret over TLS is the strongest scheme they
 * support; we harden it with constant-time comparison + a hard prod block
 * on the unauth bypass.
 */

const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const { handleTrackingUpdate } = require('../controllers/shiprocketWebhookController');

// Constant-time compare — guards against remote timing attacks on the secret.
// Returns false (rather than throwing) when lengths differ, since
// `crypto.timingSafeEqual` requires equal-length Buffers.
const safeEqual = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
};

// ─── API Key Auth Middleware ───
// Required: x-api-key header matching SHIPROCKET_WEBHOOK_SECRET / VERIFY_TOKEN.
// `ALLOW_WEBHOOK_UNAUTH=true` exists ONLY for the initial Shiprocket setup
// flow ("Test Webhook" button) and is FORCE-IGNORED in production — leaving
// it on by accident must never open the endpoint.
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const expectedKey = process.env.SHIPROCKET_WEBHOOK_SECRET || process.env.VERIFY_TOKEN;
  const isProduction = process.env.NODE_ENV === 'production';
  const allowUnauth = !isProduction && process.env.ALLOW_WEBHOOK_UNAUTH === 'true';

  // Misconfiguration — no expected key set in env. Fail closed so traffic
  // can never bypass auth by accident.
  if (!expectedKey) {
    console.error('🚫 [Shiprocket Webhook] No SHIPROCKET_WEBHOOK_SECRET configured — rejecting');
    return res.status(500).json({ success: false, message: 'Webhook misconfigured' });
  }

  // No key supplied — reject unless explicit setup override is on (non-prod only).
  if (!apiKey) {
    if (allowUnauth) {
      console.warn(`⚠️ [Shiprocket Webhook] No x-api-key from ${req.ip} — allowed by ALLOW_WEBHOOK_UNAUTH (setup mode, non-prod)`);
      return next();
    }
    console.warn(`🚫 [Shiprocket Webhook] Missing x-api-key from ${req.ip}`);
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  // Key supplied — constant-time compare against the expected secret.
  if (!safeEqual(apiKey, expectedKey)) {
    console.warn(`🚫 [Shiprocket Webhook] Invalid x-api-key from ${req.ip}`);
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  next();
};

// GET /api/webhook/tracking — Health check (open access, no auth)
router.get('/tracking', (req, res) => {
  res.status(200).json({ message: 'Webhook endpoint is live' });
});

// POST /api/webhook/tracking — Webhook handler
router.post('/tracking', validateApiKey, handleTrackingUpdate);

module.exports = router;
