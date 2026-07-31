/**
 * NoSQL-injection sanitizer for request input.
 *
 * Strips keys that Mongo would interpret as operators (`$...`) or as dotted
 * paths (`a.b`) from the request body and query string.
 *
 * ⚠️  WHY `req.query` NEEDS `defineProperty` AND NOT MUTATION
 * Under Express 5, `req.query` is a GETTER on the request prototype that
 * re-parses the query string on *every* access. Mutating the object it hands
 * back — `sanitize(req.query)` — therefore cleans a throwaway copy, and the
 * route handler, reading `req.query` again, still sees the original keys. The
 * control looked like it worked and silently did nothing. Verified against
 * express 5.2.1. We shadow the getter with a plain own data property holding
 * the sanitized result, so every later read sees the cleaned object.
 *
 * The copy keeps the parser's null prototype: Express's query parser returns
 * null-prototype objects, and handing downstream code an `Object.prototype`
 * object instead would make inherited keys (`constructor`, `toString`, …)
 * answer truthy to `req.query.someKey` lookups.
 *
 * Note on today's exposure: with Express 5's default ("simple") query parser,
 * bracket notation does NOT nest — `?category[$ne]=x` arrives as the flat key
 * `"category[$ne]"`, so `req.query.category` is undefined and no operator
 * object reaches Mongo. Switching to the `extended` parser makes the same URL
 * parse to `{ category: { $ne: 'x' } }` and immediately exploitable. This
 * middleware is what makes that switch safe.
 */

const sanitize = (obj) => {
  if (obj && typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key];
      } else if (typeof obj[key] === 'object') {
        sanitize(obj[key]);
      }
    }
  }
  return obj;
};

const sanitizeRequest = (req, res, next) => {
  // Skip sanitization for the Meta WhatsApp webhook — Meta sends dotted query
  // keys (hub.mode, hub.verify_token, hub.challenge) that the sanitizer would
  // strip, causing verification to fail. Those handlers never feed query into
  // Mongo, so the NoSQL-injection risk doesn't apply.
  // (This matches only the Meta mount at `/webhook`; the Shiprocket webhook is
  // mounted at `/api/webhook` and is still sanitized.)
  if (req.path.startsWith('/webhook')) return next();

  if (req.body) sanitize(req.body);

  const cleanedQuery = sanitize(Object.assign(Object.create(null), req.query));
  Object.defineProperty(req, 'query', {
    value: cleanedQuery,
    writable: true,
    configurable: true,
    enumerable: true,
  });

  next();
};

module.exports = sanitizeRequest;
module.exports.sanitize = sanitize;
