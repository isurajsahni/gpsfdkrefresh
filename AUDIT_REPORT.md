# Code Audit Report — gpsfdk.com

**Date:** 2026-06-21
**Branch audited:** `claude/razorpay-coldstart-retry`
**Scope:** Full codebase — server (controllers, routes, middleware, models, webhooks, utils), client (routing, auth, build, bundles), dependencies, and secrets hygiene.
**Method:** Line-by-line review of all security- and correctness-critical paths, ESLint, production build, `npm audit`, and a tracked-source secret scan. Every finding below was verified against the actual source.

---

## Verdict

The application code is **well-engineered**. Core commerce and auth flows are secure and correct. The findings are concentrated in **dependency CVEs** (the single most material item) and a set of **hardening gaps** — not broken core logic. There are no known live exploits in the application code itself.

---

## Summary table

| ID | Severity | Problem | Location | Status |
|----|----------|---------|----------|--------|
| H1 | 🔴 High | Outdated dependencies with known CVEs (axios, react-router-dom, multer, cloudinary, lodash…) | `server` + `client` package deps | **Mostly fixed** — client 9→0, server 9 high→2; cloudinary chain deferred |
| M1 | 🟠 Medium | Password/email change with no current-password re-auth | `server/controllers/authController.js:332` | ✅ Fixed |
| M2 | 🟠 Medium | Public diagnostics endpoint leaks server config | `server/routes/whatsappOtp.js:48` | ✅ Fixed (now `protect, admin`) |
| M3 | 🟠 Medium | Dead Stripe path trusts client-supplied prices | `server/controllers/paymentController.js:333` | ✅ Fixed (removed entirely) |
| L1 | 🟡 Low | OTPs generated with `Math.random()` (not crypto-secure) | authController (×4), `whatsappOtp.js:112` | ✅ Fixed (`crypto.randomInt`) |
| L2 | 🟡 Low | `subCategory` regex not escaped (ReDoS) | `server/controllers/productController.js:82` | ✅ Fixed |
| L3 | 🟡 Low | Phone login matches via partial `$regex` substring | `authController.js:869`, `:920` | ✅ Fixed (end-anchored last-10) |
| L4 | 🟡 Low | Email enumeration on registration endpoints | `authController.js:38`, `:96` | ⏸️ Accepted — registration needs the "email taken" signal; already rate-limited |
| L5 | 🟡 Low | Product search uses unindexed regex despite `$text` index | `productController.js:98` | ⏸️ Deferred — fine at current scale; `$text` changes match semantics, needs testing |
| L6 | 🟡 Low | Custom-canvas pricing depends on hardcoded template slug | `orderController.js:192` | ⏸️ Needs product decision (dedicated pricing product) |
| L7 | 🟡 Low | Public AWB tracking endpoint (no auth) | `server/routes/orders.js:14` | ⏸️ Accepted — tracking pages are conventionally public |
| L8 | 🟡 Low | Meta WhatsApp webhook has no signature verification | `server/routes/webhook.js:47` | ⏸️ Accepted — handler is inert (logs only); revisit if extended |
| L9 | ⚪ Info | JWT stored in `localStorage` (XSS-exposable) | `client/src/context/AuthContext.jsx`, `utils/api.js` | ⏸️ Informational — now partly mitigated by M1 |
| L10 | ⚪ Info | CORS trusts any `*.vercel.app` origin with credentials | `server/index.js:79` | ⏸️ Informational — intentional for preview deploys |
| C1 | 🧹 Cleanup | Unused `openai` dependency | `server/package.json` | ✅ Removed |
| C2 | 🧹 Cleanup | ~18 one-off test/fetch scripts tracked in git | `server/`, `scratch/` | ✅ Deleted (20 files; ops scripts kept) |
| C3 | 🧹 Cleanup | Backup JSON files committed | `products_backup.json`, `categories_backup.json` | ✅ Deleted |
| C4 | ✅ Fixed | ESLint error: empty catch block | `client/src/pages/CheckoutPage.jsx:537` | Fixed this session |

---

## 🔴 High severity

### H1 — Outdated dependencies with known high-severity CVEs

**Where:** `server/package.json`, `client/package.json`
**Detail:** `npm audit` reports **server: 24 vulnerabilities (15 moderate, 9 high)** and **client: 9 vulnerabilities (2 moderate, 7 high)**. Notable **direct** dependencies:

- **`axios`** (server + client) — SSRF / `NO_PROXY` bypass, ReDoS via cookie-name injection, multiple prototype-pollution gadgets, proxy-auth credential leakage.
- **`react-router-dom` ^7.13.1** (client) — stored XSS via unescaped Location header, open redirect via protocol-relative URLs, DoS, and an RCE in the SSR/RSC deserialization path. *Note: this is a client-only SPA (`BrowserRouter`), so the RCE path is not reachable, but the XSS/open-redirect items can apply.*
- **`multer`** — DoS via deeply nested field names / incomplete cleanup of aborted uploads (used directly on the image-upload path).
- **`cloudinary`** — argument injection via `&` in parameters.
- **`lodash`** — code injection via `_.template`, prototype pollution (transitive).
- **`path-to-regexp`, `form-data`, `@grpc/grpc-js`, `protobufjs`, `picomatch`** — ReDoS / DoS / CRLF injection (mostly transitive via Express, firebase-admin, vite).

**Impact:** Ranges from DoS to prototype-pollution and (context-limited) XSS. Several are reachable through the upload and HTTP-client paths.
**Recommendation:** Run `npm audit fix` in both `server/` and `client/` (most fixes are non-breaking), then bump `axios` and `react-router-dom` explicitly. Requires `npm install` + a build/smoke test — a deliberate, verified change, not a blind one.

**Status (2026-06-21):**
- ✅ **Client: 9 → 0 vulnerabilities.** `react-router-dom` 7.13.1 → 7.18.0, `axios` 1.13.6 → 1.18.0 (both in-range/non-breaking). Production build verified passing.
- ✅ **Server: 24 → 10 vulnerabilities (9 high → 2 high).** `axios` → 1.18.0, `multer` → 2.2.0, plus in-range fixes for lodash/path-to-regexp/form-data/@grpc/protobufjs. Module-load smoke test passed.
- ⏸️ **Deferred:** `cloudinary` v1 → v2 and `multer-storage-cloudinary` (the 2 remaining server highs). These need breaking major bumps that touch the entire image-upload pipeline and must be tested against live Cloudinary. Low real-world reachability (all Cloudinary params are server-controlled). Track as a dedicated, tested upgrade.

---

## 🟠 Medium severity

### M1 — Password/email change without current-password re-authentication

**Where:** `server/controllers/authController.js:332` (`updateProfile`)
**Detail:** A valid session can set a new password (and, with the email-OTP token, a new email) **without re-entering the current password**. `protect` only proves the request carries a valid JWT.
**Impact:** A stolen, leaked, or XSS-exfiltrated JWT (7-day lifetime, see L9) → full account takeover, since the attacker can immediately rotate the password and lock out the owner.
**Recommendation:** Require `await user.matchPassword(currentPassword)` before applying a password change; consider the same for email changes.

### M2 — Public diagnostics endpoint leaks server configuration

**Where:** `server/routes/whatsappOtp.js:48` (`GET /api/whatsapp-otp/diagnose`)
**Detail:** Unauthenticated endpoint returns: which OTP channels are configured, `PHONE_NUMBER_ID` last-4 digits, `WHATSAPP_TOKEN` length, API version, template names, sender email, and infra hints ("Set X in Render env").
**Impact:** Information disclosure that aids targeted attacks / reconnaissance. No full secret is exposed, but it confirms infra (Render), partial identifiers, and configuration state.
**Recommendation:** Gate behind `protect, admin`, or remove from production.

### M3 — Dead Stripe path trusts client-supplied prices

**Where:** `server/controllers/paymentController.js:333` (`createStripeSession`); mounted in `server/index.js:58` (raw webhook) and `server/routes/payments.js:12,19`
**Detail:** `createStripeSession` builds Stripe line items from client-supplied `item.price` with **no server-side recalculation**. The frontend never calls Stripe (verified — Razorpay is the only gateway), so it is currently dead code, but the routes are live and mounted.
**Impact:** Price tampering **if** the Stripe path were ever enabled. Also unused attack surface + the heavy `stripe` dependency.
**Recommendation:** Remove the Stripe controller functions, routes, webhook mount, the `stripe` dependency, and the `'stripe'` enum/validator entries. (If Stripe is genuinely planned, instead recalculate prices server-side via `calculateOrderPrices` like the Razorpay path does.)

---

## 🟡 Low severity / hardening

### L1 — OTPs generated with `Math.random()`

**Where:** `server/controllers/authController.js` (registration, email-update, forgot-password, passwordless), `server/routes/whatsappOtp.js:112`
**Detail:** `Math.floor(100000 + Math.random() * 900000)` is not cryptographically secure.
**Impact:** Theoretically predictable OTPs. **Mitigated** in practice by per-identifier rate limits, 5-attempt caps, and 5–10 minute expiry.
**Recommendation:** Use `crypto.randomInt(100000, 1000000)`.

### L2 — `subCategory` regex not escaped (ReDoS)

**Where:** `server/controllers/productController.js:82`
**Detail:** `subCategory.replace(/-/g, '.*')` is fed into `$regex` without escaping other regex metacharacters — inconsistent with every other regex in the codebase, which **is** escaped (e.g. search at `:101`, admin search in orderController/authController).
**Impact:** A crafted `subCategory` query param could cause catastrophic backtracking (ReDoS).
**Recommendation:** Escape metacharacters before substituting the hyphen wildcard.

### L3 — Phone login matches via partial `$regex` substring

**Where:** `server/controllers/authController.js:869` (passwordless), `:920` (Firebase)
**Detail:** Lookup uses `{ phone: { $regex: digits, $options: 'i' } }`, a substring match that returns the first hit.
**Impact:** A user whose stored number *contains* the supplied digits as a substring could be matched — wrong-account login in edge cases.
**Recommendation:** Normalize and match exactly (e.g. compare last-10-digits with an anchored/equality query).

### L4 — Email enumeration on registration

**Where:** `server/controllers/authController.js:38` (`register`), `:96` (`sendRegistrationOtp`)
**Detail:** Both return "User already exists" for known emails. `forgotPassword:614` correctly avoids enumeration — this is inconsistent.
**Impact:** Lets an attacker confirm which emails have accounts. Low (registration enumeration is widely accepted), but inconsistent with the project's own forgot-password behavior.
**Recommendation:** Optional — use a generic message or send a "you already have an account" email instead of a direct yes/no.

### L5 — Product search uses unindexed regex despite an existing `$text` index

**Where:** `server/controllers/productController.js:98`; index defined in `server/models/Product.js:75`
**Detail:** Search runs case-insensitive `$regex` collection scans on `name`/`description`/`subCategory`, even though a `name+description` text index exists. The controller comment acknowledges the TODO.
**Impact:** Slow search as the catalogue grows. Negligible at current size (~tens of products).
**Recommendation:** Switch to `$text` search, or keep regex but anchor it.

### L6 — Custom-canvas pricing depends on a hardcoded template slug

**Where:** `server/controllers/orderController.js:192` (`calculateOrderPrices`)
**Detail:** Custom uploads with no `product` id fall back to a product with slug `the-dapper-predator` (then any "Canvas" product, then the first variation) to derive a price.
**Impact:** If that template product is deleted, renamed, or re-priced, custom-canvas order prices silently shift to the fallback — a business-logic fragility, not a security hole.
**Recommendation:** Use a dedicated, clearly-named "custom canvas pricing" product (or an explicit pricing table) that isn't part of the normal catalogue.

### L7 — Public AWB tracking endpoint

**Where:** `server/routes/orders.js:14` (`GET /track-awb/:awb`, no auth)
**Detail:** Anyone with an AWB number can fetch courier tracking.
**Impact:** Minor info exposure (delivery status/location for a shipment). AWBs are semi-secret.
**Recommendation:** Acceptable for a tracking page; optionally require order-number + contact like `/track` does.

### L8 — Meta WhatsApp webhook has no signature verification

**Where:** `server/routes/webhook.js:47` (`POST /webhook/whatsapp`)
**Detail:** No `X-Hub-Signature-256` HMAC check. **However**, the handler only `console.log`s the payload and returns 200 — it performs no DB writes or side effects, so it is effectively inert.
**Impact:** Log spam only, in its current form.
**Recommendation:** If this handler is ever extended to act on inbound messages, add `X-Hub-Signature-256` verification first.

### L9 — JWT stored in `localStorage` (informational)

**Where:** `client/src/context/AuthContext.jsx`, `client/src/utils/api.js`
**Detail:** Tokens live in `localStorage` with a 7-day expiry and no rotation/refresh, so any XSS can exfiltrate them. This is the standard SPA tradeoff and amplifies M1.
**Recommendation:** Informational. httpOnly cookies are more secure but a larger architectural change; at minimum, pair with M1 (re-auth on sensitive changes).

### L10 — CORS trusts any `*.vercel.app` origin with credentials (informational)

**Where:** `server/index.js:79`
**Detail:** `origin.endsWith('.vercel.app')` allows any Vercel-hosted site to make credentialed requests. Intentional for preview deploys.
**Recommendation:** Informational. Tighten to known project domains if you want to lock it down.

---

## 🧹 Cleanup / dead code

| ID | Item | Notes |
|----|------|-------|
| C1 | `openai` dependency | Never imported anywhere — chat uses Gemini (`@google/generative-ai`). Safe to remove. |
| C2 | ~18 one-off scripts tracked in git | `server/test_otp.js`, `test_otp2.js`, `test_verify.js`, `find_api.js`, `fetch_product_images.js`, `fetch_product_images_direct.js`, `print_urls.js`, `seed_with_resolved_dns.js`, `test-gemini.js`, `server/scripts/test-*.js`, `scratch/*`. None run in production. |
| C3 | Backup JSONs | `products_backup.json`, `categories_backup.json` at repo root. |
| C4 | ESLint error (empty catch) | **Fixed this session** at `client/src/pages/CheckoutPage.jsx:537`; lint now passes clean. |

> `stripe` dependency removal is tracked under **M3**.

---

## ✅ Verified strong (no action needed)

- **Payments:** Razorpay HMAC signature verification, idempotency on `payment_id`, **server-side price recalculation** (never trusts client prices), amount cross-check against order notes, cold-start retry on transient failures.
- **Orders/stock:** Atomic per-variation stock decrement/restore, COD region-gating, coupon usage/limit enforcement, discount capped at subtotal.
- **Auth:** bcrypt cost-12 hashing, account lockout after 5 failed logins, JWT verification, role-based route guards (`protect`/`admin`/`authorizeRoles`) with ownership checks, OTP attempt caps + expiry.
- **Input/infra:** express-validator on auth/order/lead routes, inline NoSQL sanitizer (Express-5-compatible), Helmet, gzip compression, global + per-route rate limiting, server-side upload MIME/size validation, constant-time API-key auth on the Shiprocket webhook (fails closed).
- **XSS:** The one `dangerouslySetInnerHTML` sink (product description) is sanitized **server-side at write time** via `sanitizeRichText`.
- **Secrets:** No hardcoded secrets in tracked source; `.env` correctly gitignored; the previously-committed Firebase key is gone (now read from `FIREBASE_WEB_API_KEY`).
- **Performance:** Route-level `lazy()` code-splitting (admin/analytics/blog not shipped to guests), proper DB indexes incl. a text index, clean production build (~4.4s).
- **SEO:** Sitemap + image sitemap, canonical host, schema, social-share previews, location pages, blog.

---

## Recommended remediation order

1. **H1** — patch dependencies (`npm audit fix` + bump axios & react-router-dom), then rebuild & smoke-test.
2. **M1** — require current-password re-auth on password/email change.
3. **M2** — lock down or remove `/api/whatsapp-otp/diagnose`.
4. **M3** — remove the dead Stripe path (+ `stripe` dep).
5. **L2 / L3** — quick wins: escape the `subCategory` regex; exact-match phone login.
6. **C1–C3** — delete dead scripts, backups, and the unused `openai` dependency.

---

## Coverage notes

All security- and correctness-critical paths were read in full. A few support utilities (`utils/geoPricing.js`, `utils/metaCapi.js`, `utils/sanitizeHtml.js` internals) and several presentational frontend pages were assessed at the interface level rather than line-by-line. No dynamic/runtime penetration testing was performed — this is a static source audit.
