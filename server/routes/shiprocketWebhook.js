/**
 * Shiprocket Tracking Webhook Route
 *
 * GET  /api/webhook/tracking → Health check (Shiprocket verifies URL is live)
 * POST /api/webhook/tracking → Handles tracking status updates
 *
 * Shiprocket sends the token in the `x-api-key` header. In production we
 * REQUIRE this header on every POST — previously we allowed missing tokens
 * for Shiprocket's "Test Webhook" button, but that meant anyone could mark
 * any order delivered/cancelled by guessing the AWB. Once setup is done,
 * Shiprocket always sends the header.
 */

const express = require('express');
const router = express.Router();
const { handleTrackingUpdate } = require('../controllers/shiprocketWebhookController');

// ─── API Key Auth Middleware ───
// Required: x-api-key header matching SHIPROCKET_WEBHOOK_SECRET / VERIFY_TOKEN.
// Set ALLOW_WEBHOOK_UNAUTH=true in env ONLY during initial Shiprocket setup
// so the "Test Webhook" button works; remove it afterwards.
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const expectedKey = process.env.SHIPROCKET_WEBHOOK_SECRET || process.env.VERIFY_TOKEN;
  const allowUnauth = process.env.ALLOW_WEBHOOK_UNAUTH === 'true';

  // Misconfiguration — no expected key set in env. Fail closed so traffic
  // can never bypass auth by accident.
  if (!expectedKey) {
    console.error('🚫 [Shiprocket Webhook] No SHIPROCKET_WEBHOOK_SECRET configured — rejecting');
    return res.status(500).json({ success: false, message: 'Webhook misconfigured' });
  }

  // No key supplied — reject unless explicit setup override is on.
  if (!apiKey) {
    if (allowUnauth) {
      console.warn(`⚠️ [Shiprocket Webhook] No x-api-key from ${req.ip} — allowed by ALLOW_WEBHOOK_UNAUTH (setup mode)`);
      return next();
    }
    console.warn(`🚫 [Shiprocket Webhook] Missing x-api-key from ${req.ip}`);
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  // Key supplied but wrong → reject.
  if (apiKey !== expectedKey) {
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
