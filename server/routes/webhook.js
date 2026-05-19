const express = require('express');
const router = express.Router();

/**
 * Meta WhatsApp Cloud API Webhook
 *
 * Mounted at /webhook in server/index.js, so the full paths are:
 *   GET  /webhook/whatsapp  — Meta callback URL verification (hub.challenge echo)
 *   POST /webhook/whatsapp  — Inbound messages & status updates
 *
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api/guides/set-up-webhooks
 */

// ─── 1. GET /webhook/whatsapp — Meta verification handshake ───
router.get('/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Prefer WHATSAPP_VERIFY_TOKEN; fall back to the legacy VERIFY_TOKEN so existing
  // Shiprocket-era deploys keep working until the env var is renamed.
  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || process.env.VERIFY_TOKEN;

  console.log('🔔 WhatsApp webhook verification request:', {
    mode,
    tokenProvided: token ? `${String(token).slice(0, 3)}…` : '(missing)',
    challenge,
    hasEnvToken: Boolean(VERIFY_TOKEN),
  });

  if (!VERIFY_TOKEN) {
    console.error('❌ WHATSAPP_VERIFY_TOKEN is not set in the environment.');
    return res.sendStatus(500);
  }

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ WhatsApp webhook verified — echoing challenge.');
    // Meta expects the raw challenge string (not JSON) with status 200.
    return res.status(200).send(challenge);
  }

  console.warn('❌ WhatsApp webhook verification failed — token mismatch or wrong mode.');
  return res.sendStatus(403);
});

// ─── 2. POST /webhook/whatsapp — inbound events ───
router.post('/whatsapp', (req, res) => {
  try {
    console.log('📥 WhatsApp Webhook Payload:', JSON.stringify(req.body, null, 2));

    const value = req.body?.entry?.[0]?.changes?.[0]?.value;
    const message = value?.messages?.[0];

    if (message) {
      const sender = message.from;
      const messageBody = message.text?.body || `[Type: ${message.type}]`;
      console.log('\n--- New WhatsApp Message ---');
      console.log(`From: ${sender}`);
      console.log(`Message: ${messageBody}`);
      console.log('---------------------------\n');
    } else if (value?.statuses?.[0]) {
      const status = value.statuses[0];
      console.log(`ℹ️ Status Update: ${status.status} for recipient ${status.recipient_id}`);
    }

    // Meta requires a 200 within 20s or it retries and eventually disables the webhook.
    return res.status(200).send('EVENT_RECEIVED');
  } catch (error) {
    console.error('❌ Webhook Processing Error:', error.message);
    return res.status(200).send('ERROR_ACKNOWLEDGED');
  }
});

module.exports = router;
