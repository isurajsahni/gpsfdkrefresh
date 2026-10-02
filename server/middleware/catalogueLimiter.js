// ─── Rate limit for public catalogue reads ───
// Search engines render many product pages in a burst from a few IPs. Under
// the global 500 requests / 15 min limit those product requests got 429s, the
// product page took that for "not found", and real products were crawled as
// noindex. Public product and category GETs (read-only) are counted here
// instead, at 5,000 per 15 min per IP; everything else keeps the global limit
// (index.js skips these requests there).
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');

const isCatalogueRead = (req) =>
  req.method === 'GET' && (req.path.startsWith('/api/products') || req.path.startsWith('/api/categories'));

// The SEO page renderer on Vercel (client/api/render.js) fetches products for
// every visitor from a few Vercel IPs, so it sends this shared secret in
// `x-seo-render-key` and isn't limited. If SEO_RENDER_KEY is unset nobody is
// exempt. Constant-time compare, as in serviceKey.js.
const hasSeoRenderKey = (req) => {
  const expected = process.env.SEO_RENDER_KEY || '';
  if (!expected) return false;
  const a = Buffer.from(req.get('x-seo-render-key') || '');
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

const catalogueLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
  skip: (req) => !isCatalogueRead(req) || hasSeoRenderKey(req),
});

module.exports = { catalogueLimiter, isCatalogueRead };
