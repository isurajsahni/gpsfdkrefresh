/**
 * Shiprocket Tracking Webhook Route
 *
 * GET  /api/webhook/tracking → Health check (Shiprocket verifies URL is live)
 * POST /api/webhook/tracking → Handles tracking status updates
 *
 * Secured via x-api-key header validation.
 */

const express = require('express');
const router = express.Router();
const { handleTrackingUpdate } = require('../controllers/shiprocketWebhookController');

// ─── API Key Auth Middleware ───
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const expectedKey = process.env.SHIPROCKET_WEBHOOK_SECRET || process.env.VERIFY_TOKEN;

  if (!apiKey || apiKey !== expectedKey) {
    console.warn(`🚫 [Shiprocket Webhook] Unauthorized request from ${req.ip} — invalid x-api-key`);
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  next();
};

// GET /api/webhook/tracking — Health check (no auth required for Shiprocket URL verification)
router.get('/tracking', (req, res) => {
  res.status(200).json({ message: 'Webhook endpoint is live' });
});

// POST /api/webhook/tracking — Webhook handler (auth required)
router.post('/tracking', validateApiKey, handleTrackingUpdate);

module.exports = router;
