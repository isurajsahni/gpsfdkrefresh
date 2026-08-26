const jwt = require('jsonwebtoken');
const axios = require('axios');
const DeviceToken = require('../models/DeviceToken');

/**
 * Firebase Cloud Messaging (HTTP v1) push sender.
 *
 * DISABLED BY DEFAULT. Like the Meta CAPI and Shiprocket integrations in this
 * codebase, it fails safe: if the FCM service-account env vars are not set it
 * logs a skip and returns { ok:false, error:'not_configured' } — it never
 * throws and never blocks the caller. So this file is completely inert until
 * push is configured, and can't break any existing flow.
 *
 * To enable, set EITHER:
 *   FCM_SERVICE_ACCOUNT  — the full service-account JSON (as a single string)
 * OR the three fields individually:
 *   FCM_PROJECT_ID
 *   FCM_CLIENT_EMAIL
 *   FCM_PRIVATE_KEY      — with literal "\n" for newlines (env-safe)
 *
 * The service account comes from Firebase Console → Project settings →
 * Service accounts → Generate new private key. Untested against a live FCM
 * project — verify on staging once credentials are in place.
 */

const OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const FCM_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';

// Resolve service-account credentials from env (either shape). Returns null when
// unconfigured.
function getCredentials() {
  if (process.env.FCM_SERVICE_ACCOUNT) {
    try {
      const sa = JSON.parse(process.env.FCM_SERVICE_ACCOUNT);
      if (sa.project_id && sa.client_email && sa.private_key) {
        return { projectId: sa.project_id, clientEmail: sa.client_email, privateKey: sa.private_key };
      }
    } catch (_) {
      console.error('[Push] FCM_SERVICE_ACCOUNT is not valid JSON — push disabled.');
      return null;
    }
  }
  const { FCM_PROJECT_ID, FCM_CLIENT_EMAIL, FCM_PRIVATE_KEY } = process.env;
  if (FCM_PROJECT_ID && FCM_CLIENT_EMAIL && FCM_PRIVATE_KEY) {
    // Env stores newlines as the two characters "\n"; restore real newlines.
    return {
      projectId: FCM_PROJECT_ID,
      clientEmail: FCM_CLIENT_EMAIL,
      privateKey: FCM_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
  }
  return null;
}

function isConfigured() {
  return getCredentials() !== null;
}

// Cache the OAuth access token until shortly before it expires.
let tokenCache = { accessToken: null, expiresAt: 0 };

async function getAccessToken(creds) {
  if (tokenCache.accessToken && Date.now() < tokenCache.expiresAt - 60_000) {
    return tokenCache.accessToken;
  }
  const now = Math.floor(Date.now() / 1000);
  const assertion = jwt.sign(
    { scope: FCM_SCOPE },
    creds.privateKey,
    {
      algorithm: 'RS256',
      issuer: creds.clientEmail,
      subject: creds.clientEmail,
      audience: OAUTH_TOKEN_URL,
      expiresIn: 3600,
    },
  );
  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion,
  });
  const { data } = await axios.post(OAUTH_TOKEN_URL, body.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 10_000,
  });
  tokenCache = {
    accessToken: data.access_token,
    expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
  };
  return tokenCache.accessToken;
}

// FCM v1 sends one message per token. Build the message body.
function buildMessage(token, { title, body, data, link }) {
  const message = {
    token,
    notification: { title, body },
  };
  // FCM data values must be strings.
  const dataPayload = {};
  if (link) dataPayload.link = String(link);
  if (data && typeof data === 'object') {
    for (const [k, v] of Object.entries(data)) dataPayload[k] = String(v);
  }
  if (Object.keys(dataPayload).length) message.data = dataPayload;
  return { message };
}

/**
 * Send a notification to a list of raw FCM tokens.
 * @returns { ok, sent, failed, error? }
 */
async function sendToTokens(tokens, payload) {
  const creds = getCredentials();
  if (!creds) {
    console.log('[Push] Skipped — FCM not configured (set FCM_SERVICE_ACCOUNT or FCM_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY).');
    return { ok: false, error: 'not_configured' };
  }
  const list = [...new Set((tokens || []).filter(Boolean))];
  if (!list.length) return { ok: true, sent: 0, failed: 0 };

  let accessToken;
  try {
    accessToken = await getAccessToken(creds);
  } catch (err) {
    console.error('[Push] Failed to mint FCM access token:', err.response?.data || err.message);
    return { ok: false, error: 'auth_failed' };
  }

  const url = `https://fcm.googleapis.com/v1/projects/${creds.projectId}/messages:send`;
  const staleTokens = [];
  let sent = 0;
  let failed = 0;

  const results = await Promise.allSettled(
    list.map((token) =>
      axios.post(url, buildMessage(token, payload), {
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        timeout: 10_000,
      }),
    ),
  );

  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      sent += 1;
    } else {
      failed += 1;
      const status = r.reason?.response?.status;
      const fcmStatus = r.reason?.response?.data?.error?.status;
      // A token that FCM reports as gone is pruned so we stop paying to retry it.
      if (status === 404 || fcmStatus === 'UNREGISTERED' || fcmStatus === 'NOT_FOUND') {
        staleTokens.push(list[i]);
      }
    }
  });

  if (staleTokens.length) {
    DeviceToken.deleteMany({ token: { $in: staleTokens } }).catch(() => {});
  }

  return { ok: true, sent, failed };
}

/** Push to every device a given user has registered. */
async function sendToUser(userId, payload) {
  if (!isConfigured()) return { ok: false, error: 'not_configured' };
  const devices = await DeviceToken.find({ user: userId }).select('token').lean();
  return sendToTokens(devices.map((d) => d.token), payload);
}

/** Broadcast to every registered device (e.g. a marketing announcement). */
async function sendToAll(payload) {
  if (!isConfigured()) return { ok: false, error: 'not_configured' };
  const devices = await DeviceToken.find({}).select('token').lean();
  return sendToTokens(devices.map((d) => d.token), payload);
}

module.exports = { isConfigured, sendToTokens, sendToUser, sendToAll };
