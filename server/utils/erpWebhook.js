// ─── Fire-and-forget outbound webhook to the ERP ───
// Opt-in: if ERP_WEBHOOK_URL / ERP_WEBHOOK_SECRET are unset it no-ops, so
// deploying this code changes NOTHING until the env vars are configured (and
// clearing them instantly disables it — fully reversible).
//
// NEVER throws and NEVER blocks the order/payment flow. Callers invoke
// `sendOrderEvent(...)` WITHOUT await, matching the non-blocking pattern already
// used for metaCapi.sendEvent() and sendOrderEmail() in orderController. If the
// ERP is down/slow the store logs one line and moves on; the pull/backfill job
// on the ERP side reconciles anything a failed push missed.

const crypto = require('crypto');
const axios = require('axios');
const serializeOrder = require('./serializeOrder');

const MAX_ATTEMPTS = 3;
const RETRY_BASE_MS = 2000;
const TIMEOUT_MS = 8000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function post(event, payloadStr, attempt = 1) {
  const url = process.env.ERP_WEBHOOK_URL;
  const secret = process.env.ERP_WEBHOOK_SECRET;
  const signature =
    'sha256=' + crypto.createHmac('sha256', secret).update(payloadStr).digest('hex');

  try {
    await axios.post(url, payloadStr, {
      timeout: TIMEOUT_MS,
      headers: {
        'Content-Type': 'application/json',
        'x-gps-event': event,
        'x-gps-signature': signature,
      },
      // We send a pre-stringified body so the signature is computed over the
      // exact bytes the ERP receives — don't let axios re-serialize.
      transformRequest: [(d) => d],
      // 4xx (e.g. bad signature / validation) are our bug, not transient —
      // don't retry those; only network errors and 5xx below.
      validateStatus: (s) => s < 500,
    });
  } catch (err) {
    // Thrown only on network error / timeout / 5xx (validateStatus lets 4xx pass).
    if (attempt < MAX_ATTEMPTS) {
      await sleep(RETRY_BASE_MS * attempt);
      return post(event, payloadStr, attempt + 1);
    }
    console.error(`[ERP webhook] ${event} failed after ${attempt} attempts:`, err.message);
  }
}

// Fire-and-forget. Call WITHOUT await from the order flow.
function sendOrderEvent(event, order) {
  try {
    if (!process.env.ERP_WEBHOOK_URL || !process.env.ERP_WEBHOOK_SECRET) return; // opt-in
    const payload = { event, sentAt: new Date().toISOString(), order: serializeOrder(order) };
    post(event, JSON.stringify(payload)).catch(() => {}); // extra guard; post already swallows
  } catch (err) {
    // serialize or dispatch setup error — never propagate to the order flow.
    console.error('[ERP webhook] dispatch error:', err.message);
  }
}

module.exports = { sendOrderEvent };
