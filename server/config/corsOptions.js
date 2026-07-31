/**
 * CORS origin policy.
 *
 * Extracted from index.js so the predicate can be unit-tested — the previous
 * inline version used substring matching on an attacker-controlled Origin
 * header with `credentials: true`, which let these through:
 *
 *   https://localhost.evil.com      (contains "localhost")
 *   https://evil.com/?x=localhost   (contains "localhost")
 *   https://127.0.0.1.evil.com      (contains "127.0.0.1")
 *   https://anything.vercel.app     (endsWith ".vercel.app" — anyone can deploy there)
 *
 * Today's blast radius is limited because auth uses `Authorization: Bearer`
 * tokens from localStorage rather than cookies, so a hostile origin cannot read
 * the token and nothing is auto-attached to cross-origin requests — it can only
 * make anonymous calls. That stops being true the moment any cookie-based
 * session is introduced, at which point substring matching would be critical.
 */

const allowedOrigins = [
  'http://localhost:5173',
  'https://gpsfdkrefresh.vercel.app',
  'https://gpsfdk.com',
  'https://www.gpsfdk.com',
  process.env.CLIENT_URL,
].filter(Boolean);

// Vercel preview/staging deployments for THIS project only. Anchored at both
// ends, and scoped to the project name: a bare `.vercel.app` suffix test would
// admit any origin on Vercel's shared domain, i.e. anyone with a free account.
// If the Vercel project is ever renamed, update this or add the origin to
// CLIENT_URL / allowedOrigins above, otherwise previews will fail CORS.
const VERCEL_PREVIEW = /^https:\/\/gpsfdkrefresh(-[a-z0-9-]+)?\.vercel\.app$/i;

// Loopback for local development, with an explicit port and nothing after it,
// so `localhost.evil.com` and `evil.com/?x=localhost` cannot match. Disabled in
// production — a deployed API has no reason to trust a developer's machine.
const LOCAL_DEV = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?$/i;

const isOriginAllowed = (origin, { isProduction = process.env.NODE_ENV === 'production' } = {}) => {
  // Requests with no Origin header (curl, server-to-server, mobile apps) are not
  // browser cross-origin requests, so CORS has nothing to protect against here.
  if (!origin) return true;
  if (typeof origin !== 'string') return false;

  if (allowedOrigins.includes(origin)) return true;
  if (VERCEL_PREVIEW.test(origin)) return true;
  if (!isProduction && LOCAL_DEV.test(origin)) return true;

  return false;
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) return callback(null, true);
    console.warn(`Origin ${origin} blocked by CORS`);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
};

module.exports = corsOptions;
module.exports.isOriginAllowed = isOriginAllowed;
module.exports.allowedOrigins = allowedOrigins;
