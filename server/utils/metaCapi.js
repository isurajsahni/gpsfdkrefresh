/**
 * Meta Conversions API (CAPI) helper
 *
 * Sends server-side events to Meta so that conversions are tracked reliably
 * even when the browser pixel is blocked (ad blockers, iOS ATT, slow networks).
 *
 * Pair every server-side event with the matching browser pixel event by using
 * the same `eventId` — Meta will deduplicate so the conversion is only counted
 * once.
 *
 * Required env vars:
 *   META_PIXEL_ID            — your pixel ID (also in client/index.html)
 *   META_CAPI_ACCESS_TOKEN   — generated in Events Manager → Settings → Conversions API
 * Optional:
 *   META_CAPI_TEST_EVENT_CODE — set during testing so events land in "Test Events"
 *   META_GRAPH_API_VERSION    — defaults to v22.0
 */

const crypto = require('crypto');

const GRAPH_VERSION = process.env.META_GRAPH_API_VERSION || 'v22.0';

const sha256 = (value) => {
  if (value === null || value === undefined) return undefined;
  const str = String(value).trim().toLowerCase();
  if (!str) return undefined;
  return crypto.createHash('sha256').update(str).digest('hex');
};

// Normalize phone to digits-only before hashing (Meta's matching requirement).
const sha256Phone = (phone) => {
  if (!phone) return undefined;
  const digits = String(phone).replace(/\D/g, '');
  if (!digits) return undefined;
  return crypto.createHash('sha256').update(digits).digest('hex');
};

/**
 * Send a single event to Meta's Conversions API.
 * Fail silently — must never block an order from being placed.
 *
 * @param {object} args
 * @param {string} args.eventName               e.g. 'Purchase', 'InitiateCheckout'
 * @param {string} [args.eventId]               unique ID used to dedupe with the browser pixel
 * @param {string} [args.eventSourceUrl]        the page URL the user was on
 * @param {object} args.userData                { email, phone, firstName, lastName, city, state, zip, country, ip, userAgent, fbp, fbc, externalId }
 * @param {object} [args.customData]            { value, currency, content_ids, contents, num_items, order_id, ... }
 * @param {number} [args.eventTime]             unix seconds (defaults to now)
 * @returns {Promise<{ok: boolean, response?: any, error?: string}>}
 */
const sendEvent = async ({
  eventName,
  eventId,
  eventSourceUrl,
  userData = {},
  customData = {},
  eventTime,
}) => {
  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;

  // Skip silently if env isn't configured — local dev or pre-rollout.
  if (!pixelId || !accessToken) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Meta CAPI] Skipped ${eventName} — META_PIXEL_ID / META_CAPI_ACCESS_TOKEN not set`);
    }
    return { ok: false, error: 'not_configured' };
  }

  const user_data = {
    em: userData.email ? [sha256(userData.email)] : undefined,
    ph: userData.phone ? [sha256Phone(userData.phone)] : undefined,
    fn: userData.firstName ? [sha256(userData.firstName)] : undefined,
    ln: userData.lastName ? [sha256(userData.lastName)] : undefined,
    ct: userData.city ? [sha256(userData.city)] : undefined,
    st: userData.state ? [sha256(userData.state)] : undefined,
    zp: userData.zip ? [sha256(userData.zip)] : undefined,
    country: userData.country ? [sha256(userData.country)] : undefined,
    external_id: userData.externalId ? [sha256(userData.externalId)] : undefined,
    client_ip_address: userData.ip || undefined,
    client_user_agent: userData.userAgent || undefined,
    fbp: userData.fbp || undefined,
    fbc: userData.fbc || undefined,
  };

  // Strip undefined keys — Meta rejects events with empty arrays.
  Object.keys(user_data).forEach((k) => {
    if (user_data[k] === undefined) delete user_data[k];
  });

  const event = {
    event_name: eventName,
    event_time: eventTime || Math.floor(Date.now() / 1000),
    action_source: 'website',
    event_source_url: eventSourceUrl || process.env.CLIENT_URL || undefined,
    event_id: eventId || undefined,
    user_data,
    custom_data: customData,
  };

  const payload = {
    data: [event],
  };
  if (process.env.META_CAPI_TEST_EVENT_CODE) {
    payload.test_event_code = process.env.META_CAPI_TEST_EVENT_CODE;
  }

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error(`[Meta CAPI] ${eventName} failed:`, res.status, body);
      return { ok: false, error: body?.error?.message || `HTTP ${res.status}`, response: body };
    }
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Meta CAPI] ${eventName} sent (event_id=${eventId || 'none'})`);
    }
    return { ok: true, response: body };
  } catch (err) {
    console.error(`[Meta CAPI] ${eventName} network error:`, err.message);
    return { ok: false, error: err.message };
  }
};

/**
 * Extract Meta identifiers + client fingerprint from an Express request.
 * Combines:
 *   - fbp / fbc from cookies or explicitly forwarded body fields
 *   - X-Forwarded-For / req.ip
 *   - User-Agent
 *
 * The browser sends fbp/fbc explicitly because they live in JS-readable
 * cookies (_fbp, _fbc) but those cookies aren't always present on the
 * server (they're set by the Meta script after the request reaches us).
 *
 * @param {import('express').Request} req
 * @returns {{ ip?: string, userAgent?: string, fbp?: string, fbc?: string }}
 */
const extractClientContext = (req) => {
  const xff = req.headers['x-forwarded-for'];
  const ip = (typeof xff === 'string' ? xff.split(',')[0].trim() : null) || req.ip || req.connection?.remoteAddress;
  const userAgent = req.headers['user-agent'];
  // fbp / fbc can be forwarded flat (e.g. /orders sends the orderData directly
  // as the body) or nested under `orderData` (e.g. /create-order wraps it).
  // Check both shapes plus the cookie jar.
  const fbp = req.body?.fbp || req.body?.orderData?.fbp || req.cookies?._fbp;
  const fbc = req.body?.fbc || req.body?.orderData?.fbc || req.cookies?._fbc;
  return {
    ip: ip && ip !== '::1' ? ip : undefined,
    userAgent: userAgent || undefined,
    fbp: fbp || undefined,
    fbc: fbc || undefined,
  };
};

module.exports = { sendEvent, extractClientContext, sha256, sha256Phone };
