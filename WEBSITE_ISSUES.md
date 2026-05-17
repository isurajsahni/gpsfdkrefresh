# gpsfdk.com — Website Issues Report

**Audit date:** 2026-05-16
**Reviewer:** Senior dev / QA pass over the React (client) + Node/Express + MongoDB (server) codebase.
**Scope:** Customer purchase flow (product page → cart → checkout → payment → thank-you), admin panel, and cross-cutting concerns (auth, security, SEO, performance).

Each finding lists **file:line**, **what is wrong**, **why it matters**, and **suggested fix**. Severity:

- 🔴 **CRITICAL** — blocks purchase, security hole, data loss, real money at risk
- 🟠 **HIGH** — regularly breaks for users, blocks admin workflow
- 🟡 **MEDIUM** — edge cases, missing validation, poor UX
- 🟢 **LOW** — polish, minor inconsistencies

---

## Part 1 — Customer Purchase Flow (Product → Checkout)

### 🔴 CRITICAL

#### C1. Coupon usage crash when a guest used the same coupon before
**File:** `server/controllers/orderController.js:321`
```js
const userUsage = coupon.usageHistory.find(
  u => u.userId.toString() === req.user._id.toString()
);
```
Guest entries in `usageHistory` have `userId: null`. The instant a logged-in customer reuses any coupon that has *any* prior guest usage, `.toString()` is called on `null` → 500 error. The order has already been `Order.create`'d *before* this line runs, so the DB ends up with an order the customer never gets confirmed.
**Why:** Recent commit `79dfec5` fixed this in `calculateOrderPrices` (line 219) and in `paymentController.verifyRazorpay` (line ~161) but missed this third site.
**Fix:** `u.userId && u.userId.toString() === req.user._id.toString()`

#### C2. Stock is checked but never decremented
**File:** `server/controllers/orderController.js:175-178`, `server/controllers/paymentController.js:120-142`
`calculateOrderPrices` reads `variation.stock` to refuse oversells but **no controller ever writes stock back** after a successful order. Two concurrent customers both pass the check and both place orders for the last unit. The in-DB stock value drifts and becomes meaningless. Admin sees "stock 100" forever.
**Fix:** Atomic decrement in the same transaction as `Order.create`:
```js
Product.updateOne(
  { _id, 'variations._id': vid, 'variations.$.stock': { $gte: qty } },
  { $inc: { 'variations.$.stock': -qty } }
)
```
On `cancelled` status transition, increment back.

#### C3. Razorpay double-spend race on Place Order button
**File:** `client/src/pages/CheckoutPage.jsx:404-414`
After `rzp.open()`, `setLoading(false)` runs immediately. The button re-enables while the Razorpay modal is open. A second click → second `POST /api/create-order` → second modal → two real `Order` documents for one cart. Server-side `verifyRazorpay` has no idempotency check against `paymentResult.id`.
**Fix:** Keep `loading=true` until Razorpay `handler` *or* `ondismiss` fires. On the server, reject the second verify if an Order with the same `razorpay_payment_id` already exists.

#### C4. Payment-verification failure leaves customer charged with no order
**File:** `client/src/pages/CheckoutPage.jsx:392-394`
When `verify-payment` POST throws (network blip, server timeout, signature mismatch), the client just shows a toast. Razorpay has captured the money, but no `Order` exists. No retry, no support email, no `localStorage` persistence of the `razorpay_payment_id`. Customer is left with a debit and no order to track.
**Fix:** Persist `{razorpay_order_id, razorpay_payment_id, razorpay_signature}` to localStorage + server "pending verification" log; recovery UI; add a Razorpay `payment.captured` webhook as safety net.

#### C5. Stock recheck at verify time can also orphan payments
**File:** `server/controllers/paymentController.js:83-142`
`calculateOrderPrices` runs again at verify-payment. If stock dropped to 0 between create-order and verify, the server throws "Insufficient stock" *after* payment was captured. Same money-no-order pattern as C4.
**Fix:** At verify time never block on stock — customer has paid. Reserve stock atomically at create-order time instead.

#### C6. ThankYou page is reload-fragile and shows no order context
**File:** `client/src/pages/ThankYouPage.jsx:1-61`
Reads nothing from URL/state. On refresh the customer sees a generic "Thank You" with no order number, no items, no total. A bored visitor opening `/thank-you` directly sees the same success screen with no purchase. Gated by `ProtectedRoute` so guest checkouts (if enabled) bounce to `/register`.
**Fix:** `navigate('/thank-you?order=GPS-XXX')`, fetch and render the order summary, gate on the param.

#### C7. Shiprocket webhook accepts unauthenticated calls
**File:** `server/routes/shiprocketWebhook.js:19-35`, `server/index.js:48`
The auth middleware explicitly allows requests with no `x-api-key` header ("test ping"). It also runs *before* the rate limiter (`/api/webhook` is skipped from the global limiter). Anyone hitting `POST /api/webhook/tracking` with no header — or a guessed/scraped AWB — can transition any order to `shipped` / `delivered` / `cancelled`, set `deliveredAt`, and fire the customer's delivery email. This bypasses refund SLAs.
**Fix:** Require `x-api-key` unconditionally; remove `/api/webhook` from the rate-limit skip list.

#### C8. Hard-coded Firebase Web API key in source
**File:** `server/controllers/authController.js:919`
```js
const apiKey = "AIzaSyB0L41Eycq725nZf5GLMaKr6xZE2WYAqSk"; // User provided
```
Committed in plaintext, bypasses your env-var convention, cannot be rotated without a code change.
**Fix:** Move to `process.env.FIREBASE_WEB_API_KEY`; rotate the key.

#### C9. No Razorpay/Stripe webhook idempotency
**File:** `server/controllers/paymentController.js:217-242`
Stripe retries `checkout.session.completed` on any 5xx. The handler has no idempotency check, so a retry re-`save()`s the order and re-fires `triggerNewOrderNotifications`, which calls Shiprocket again → duplicate shipment. Same for any replay of Razorpay verify.
**Fix:** Before `Order.create` / `order.save`, look up by `paymentResult.id` and short-circuit if it already exists.

---

### 🟠 HIGH

#### H1. Shipping fee threshold mismatch — CartPage says "FREE" but Checkout charges ₹50
**File:** `client/src/pages/CartPage.jsx:12` vs `client/src/pages/CheckoutPage.jsx:267` and `server/controllers/orderController.js:205`
```js
// CartPage:     cartTotal > 0 && cartTotal < 499 ? 50 : 0
// Checkout/srv: cartTotal >= 999 ? 0 : 50
```
A cart of ₹600 says "FREE SHIPPING" on CartPage but charges ₹50 at Checkout. Guaranteed customer complaints.
**Fix:** Centralize the threshold in a shared constant (`client/src/utils/shipping.js`, mirror in server).

#### H2. Guest checkout backend exists but is unreachable from UI
**File:** `client/src/App.jsx:212`, `client/src/components/ProtectedRoute.jsx:15`
`/checkout` is gated by `ProtectedRoute` → unauthenticated users bounce to `/register`. Yet the server exposes `POST /orders/guest` (`server/routes/orders.js:11`) and `CheckoutPage:334` branches on `user ? '/orders' : '/orders/guest'`. The guest branch is unreachable, forcing every customer to register. Major conversion drop.
**Fix:** Remove the wrapper, or add a "Continue as Guest" CTA on the redirect destination.

#### H3. Razorpay currency mismatch — INR notes vs foreign-currency charge
**File:** `server/controllers/paymentController.js:30-48, 113-117`
For international users, the Razorpay order is created in USD (or similar) with `notes.inr_total = prices.totalPrice`. Verify compares `storedInrTotal` to `prices.totalPrice` with a 1-rupee tolerance. But the **stored `Order.totalPrice` is in INR** while the customer was actually charged the converted amount. Reports, refunds, and dashboards all show wrong numbers vs Razorpay reality.
**Fix:** Persist both the charged currency/amount AND `inr_total` on the Order; compare like-for-like at refund time.

#### H4. CheckoutPage redirect-during-render anti-pattern
**File:** `client/src/pages/CheckoutPage.jsx:417-420`
```js
if (cartItems.length === 0) { navigate('/cart'); return null; }
```
After successful order: `clearCart()` runs, then `navigate('/thank-you')`. If clearCart flushes first, the next render sees `cartItems.length === 0` and redirects to `/cart` *instead of* `/thank-you`. Race depends on render order.
**Fix:** Gate redirect on a `submitted` flag, or put it in a `useEffect`.

#### H5. Coupon validation trusts client-supplied `orderTotal`
**File:** `server/controllers/couponController.js:67-89`
The frontend sends the cart subtotal as `orderTotal`; the server doesn't recompute from cart items. A scripted client passes `orderTotal: 99999` to bypass min-order checks. Order-creation later recomputes from real prices (good), but the `/validate` endpoint hands out misleading data that could leak into UI promises.
**Fix:** Pass `items[]` to `/validate` and recompute server-side.

#### H6. Address validation is India-only but Country field is editable
**File:** `client/src/utils/validation.js:91-97`, `server/middleware/validators.js:62`
Pincode regex `/^\d{6}$/` is India-only. State must be in `INDIAN_STATES`. International users (the geo-pricing in `paymentController` clearly anticipates them) cannot place orders.
**Fix:** Country-aware validators.

#### H7. No React error boundary anywhere
**File:** `client/src/App.jsx` (none defined)
A single render error in any deep component (bad product data, currency context throw, malformed price) crashes the whole SPA to a blank white screen. Repo-wide grep for `ErrorBoundary` returns zero matches.
**Fix:** Wrap `<Routes>` and at minimum the admin tree in an `<ErrorBoundary>`.

#### H8. Express `trust proxy` not set behind Render
**File:** `server/index.js` (missing `app.set('trust proxy', 1)`)
Render terminates TLS at a proxy. Without `trust proxy`, `req.ip` is the proxy's IP for every visitor, so `express-rate-limit` throttles **all users as one IP**. Once any user exceeds the limiter, every other user is locked out. Also breaks IP analytics and geo pricing.
**Fix:** `app.set('trust proxy', 1)`.

#### H9. publicEndpointLimiter (10/min) will lock out normal users
**File:** `server/routes/analytics.js:8`, `server/middleware/validators.js:95-99`
`ScrollManager` fires `/analytics/track` on every `location.pathname/search` change. A normal browsing session (home → category → filters → product → back) easily hits 10 calls/minute.
**Fix:** Raise to 60–120/min, or skip the limiter for `/analytics/track` and `/analytics/log-404`.

#### H10. No code splitting — every guest downloads the admin bundle
**File:** `client/src/App.jsx:53-67`, `client/vite.config.js`
Admin pages, Marketing dashboard, InvoicePreview, ChatBot, framer-motion-heavy invoice templates are all eagerly imported. Zero `React.lazy` usage. Guests on the homepage download megabytes of admin code, tanking LCP / Core Web Vitals.
**Fix:** `React.lazy` + `<Suspense>` on admin routes, checkout, blog, and invoice preview.

#### H11. Stored XSS via product description
**File:** `client/src/pages/ProductPage.jsx:389`
`dangerouslySetInnerHTML={{ __html: product.description }}` with no sanitization. Admin compromise (one of 6 role accounts) → site-wide XSS, including the checkout page. JWT lives in `localStorage` (7-day expiry) → easy exfiltration → sticky account takeover.
**Fix:** Sanitize on save with `sanitize-html`/`DOMPurify`; reduce JWT expiry; consider httpOnly cookie storage.

#### H12. Catch-all `/:slug` blocks the `*` 404 route, and noindex is in the wrong place
**File:** `client/src/App.jsx:243-247`, `client/src/pages/NotFoundPage.jsx:52-54`
Any non-existent top-level URL matches `/:slug` first → CategoryPage → API 404 → renders `<NotFoundPage />`. Two server round-trips for an obviously-bad URL. **And** the `<meta name="robots" content="noindex">` is inside a `<div className="hidden">` block, not inside `<Helmet>`, so it never reaches `<head>` and search engines do not see the noindex. HTTP status remains 200 (SPA on Vercel).
**Fix:** Put noindex inside `<Helmet>` in `NotFoundPage.jsx`. Consider a known-categories allowlist for `/:slug`.

#### H13. Missing MongoDB indexes
**File:** `server/models/Product.js:60-62`, `server/models/Order.js`
Only `category`, `featured`, `tags` are indexed on Product. Active query path filters by `isActive`, `subCategory`, `name`/`description` regex, sorts by `basePrice` and `createdAt` — none indexed. Order has no indexes on `user`, `status`, `isPaid`, or `orderNumber`. On any real catalogue size, sort+filter does collection scans.
**Fix:**
```js
productSchema.index({ isActive: 1, createdAt: -1 });
productSchema.index({ subCategory: 1 });
productSchema.index({ basePrice: 1 });
productSchema.index({ name: 'text', description: 'text' }); // and use $text not regex
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ orderNumber: 1 }, { unique: true });
```

#### H14. `optionalAuth` middleware swallows invalid-token errors silently
**File:** `server/middleware/auth.js:30-41`
On an expired/invalid token the route runs as anonymous. Combined with the client-side silent-401 list (`api.js:37-41`), the client still believes it's logged in. Routes using `optionalAuth` apply the wrong pricing tier or coupon logic to "phantom" logged-in users.
**Fix:** Distinguish "no token" (OK) from "invalid token" (return 401).

#### H15. In-memory OTP / registration sessions break under multi-instance / restart
**File:** `server/controllers/authController.js:10-38, 805`
`emailOtpSessions`, `registrationOtpSessions`, `passwordlessOtpSessions` are in-process `Map`s. Render's autoscaling or any deploy mid-OTP loses the session. Also stores plaintext passwords in the Node heap for 10 minutes (line 137).
**Fix:** Migrate to the existing `Otp` Mongo model (used by `whatsappOtp.js`), or Redis. Hash OTPs at rest; hash the password before storing or re-prompt at verify time.

---

### 🟡 MEDIUM

#### M1. Stale variation when navigating between PDPs
**File:** `client/src/pages/ProductPage.jsx:54-56`
Navigating from product A (with variations) to product B (no variations) keeps A's `selectedVariation`. `handleAddToCart` then adds B with A's variation/price → wrong cart price.
**Fix:** Always reset `selectedVariation` on slug change.

#### M2. No client-side stock check on Add to Cart
**File:** `client/src/pages/ProductPage.jsx:146-153`
User can pick a sold-out variation (stock=0), add to cart, enter address, see Razorpay open, then get a 400 at create-order. Frustrating dropoff.
**Fix:** Show "Out of stock" on variation buttons; disable Add-to-Cart for unavailable variations.

#### M3. Address phone auto-fires abandoned-cart on every keystroke
**File:** `client/src/pages/CheckoutPage.jsx:136-163`
2s debounce mitigates rapid typing but stores half-typed phone numbers (`+919`) as "abandoned" contact info, polluting remarketing data.
**Fix:** Only POST after `phone` passes `validators.phone`.

#### M4. Pincode lookup races with manual entry
**File:** `client/src/pages/CheckoutPage.jsx:55-86`
If the user types city while the postalpincode.in lookup is in flight, the response clobbers their input.
**Fix:** Check whether `address.city/state` are still empty before overwriting.

#### M5. Razorpay script load failure has no retry
**File:** `client/src/pages/CheckoutPage.jsx:355-360`
On flaky 3G a single script-load failure ends the checkout with just a toast.
**Fix:** Retry 1–2 times; show a recoverable "Try again" CTA.

#### M6. `couponError` is never cleared on input change
**File:** `client/src/pages/CheckoutPage.jsx:248-264`
After an invalid attempt the error toast stays visible while the user retypes.
**Fix:** Clear `couponError` in the `onChange`.

#### M7. localStorage cart has no schema version, no price refresh
**File:** `client/src/context/CartContext.jsx:8-15`
When prices change, the cart still displays old prices until the user removes/re-adds. Server-side check catches it for the payment, but the UI lies until then.
**Fix:** Hydrate from a `/products/cart-sync` endpoint on load, or stamp items with TTL.

#### M8. Currency UI mismatch on cart/checkout
**File:** `client/src/context/CurrencyContext.jsx:73-79`, `CheckoutPage.jsx:290`
`formatPrice` converts on display but `cartTotal`, `appliedDiscount`, `finalTotal` are stored in **INR** in JS state. Banners like "Add ₹X for free shipping" appear while the user sees $ prices.
**Fix:** Standardize on one currency in state; convert only at the leaf component.

#### M9. `Coupon.discountValue` not bound-checked
**File:** `server/models/Coupon.js:16-19`, `couponController.js`
Admin can save `discountType: 'percentage'`, `discountValue: 200` → 200% discount. Capped to `Math.min(discount, total)` at order time but UI shows nonsense.
**Fix:** Mongoose validators: percentage → `min: 0, max: 100`, fixed → sanity max.

#### M10. `orderNumber` collision risk
**File:** `server/models/Order.js:79-81`
`'GPS-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5)` — only 3 base-36 random chars (46,656 combos). Burst load (sale) → unique-index violation → generic 500 mid-checkout.
**Fix:** `crypto.randomBytes(4).toString('hex')` or a counter.

#### M11. WhatsAppOtpModal is dead code
**File:** `client/src/components/checkout/WhatsAppOtpModal.jsx`
Not imported anywhere. Either wire it into checkout or delete.

#### M12. `getCountryFromIP` blocks page-view tracking on third-party API
**File:** `server/controllers/analyticsController.js:111-126`
Uses `ip-api.com` free tier (~45 req/min, no API key, no HTTPS, no fetch timeout). At any scale this blocks `/analytics/track` for seconds.
**Fix:** Background it (don't `await`); cache by `/24` subnet; or use `geoip-lite` locally.

#### M13. CORS misses Vercel preview deploys
**File:** `server/index.js:51-64`
Allows `gpsfdkrefresh.vercel.app` but not `*.vercel.app` previews. Also missing `OPTIONS`/`PATCH` methods.
**Fix:** Origin function matching `/\.vercel\.app$/`.

#### M14. Visitor ID uses `Math.random`
**File:** `client/src/App.jsx:70-77`
Non-crypto random + low entropy (≈26 bits). Collisions misattribute multiple humans to the same visitor in analytics.
**Fix:** `crypto.randomUUID()`.

#### M15. `triggerNewOrderNotifications` not awaited
**File:** `server/controllers/paymentController.js:170-173`, `orderController.js:341-343`
Fire-and-forget. On Render free dyno (or under load), the function may be killed before email/Shiprocket calls complete. Customer sees "success" with no email.
**Fix:** Await it, or queue via a job runner.

#### M16. ProductPage `findVariation` falls back to stale selection
**File:** `client/src/pages/ProductPage.jsx:143`
When no variation matches the current size/material/frame combo, the UI shows the new option as "selected" while the actual variation is the old one. Confusing.

#### M17. Stale orders accumulate
**File:** `server/controllers/orderController.js:437`
`payment_pending` orders pile up forever when users abandon Razorpay. No TTL or cleanup job.
**Fix:** Cron sweep older-than-24h `payment_pending` orders.

---

### 🟢 LOW

- **L1** Product schema `availability` always `InStock` even when sold out — misleads Google Shopping (`ProductPage.jsx:172`).
- **L2** No `<img loading="lazy">` on most product imagery — 32 of 38 `<img>` tags lack it.
- **L3** No accessibility on multi-step checkout — step indicator is purely visual, no `aria-current`, focus not moved on step change (`CheckoutPage.jsx:430-440`).
- **L4** Razorpay `prefill.contact` may include `+91` prefix that breaks SMS confirmation (`CheckoutPage.jsx:396`).
- **L5** ProductPage image zoom stays active even when image 404s (no `onError`) (`ProductPage.jsx:227-239`).
- **L6** `paymentMethod` enum missing `'cod'` despite controller comments referencing it (`Order.js:45`).
- **L7** Sitemap unbounded `Product.find({isActive:true})` will OOM at scale (`sitemap.js:27-30`); no `Cache-Control` header.
- **L8** Sitemap hard-codes blog slugs — duplicated state with `client/src/content/blogs/index.js`.
- **L9** Address landmark field stored as `addressLine2` — Shiprocket may misread (`CheckoutPage.jsx:602-611`).

---

## Part 2 — Admin Panel

### 🔴 CRITICAL

#### AC1. AdminCoupons crashes on empty state — missing icon import
**File:** `client/src/pages/admin/AdminCoupons.jsx:3, 320`
`<HiOutlineTicket />` is rendered in the empty-state block but not imported. On a fresh DB (or after deleting all coupons), the page throws `ReferenceError: HiOutlineTicket is not defined` and renders blank.
**Fix:** Add `HiOutlineTicket` to the `react-icons/hi` import.

#### AC2. Same coupon `userId.toString()` null crash on createOrder
(Duplicate of **C1** above — surfaces from admin view too: orders fail for any logged-in customer reusing a coupon that has guest history.)

#### AC3. `/coupons/validate` is public, no rate limit, no input guard
**File:** `server/routes/coupons.js:18`, `server/controllers/couponController.js:72`
No rate limit, no `validate` step. `code.toUpperCase()` throws 500 on missing/non-string. Distinguishable error messages enable code enumeration ("Invalid coupon" vs "expired" vs "inactive").
**Fix:** Add `publicEndpointLimiter`, type guard, normalize all coupon failures to a single "Invalid coupon" message.

#### AC4. `/upload/canvas` is public — anyone can drain Cloudinary
**File:** `server/routes/upload.js:24`, `server/middleware/upload.js:33-43`, `server/index.js:35`
Unauthenticated 5 MB uploads to Cloudinary. Global limiter explicitly skips `/api/upload`. One anonymous attacker can blow your Cloudinary quota in minutes.
**Fix:** Per-IP rate limit, require auth or short-lived signed upload token.

#### AC5. Stock never decremented or restored
(Duplicate of **C2** above — admins also have no way to manually restock from the UI.)

#### AC6. Category rename keeps the old slug
**File:** `server/controllers/categoryController.js:33-47`, `server/models/Category.js:13-17`
`findByIdAndUpdate` skips `pre('save')` hooks. Renaming "Wall Canvas" to "Premium Canvas" leaves the slug `wall-canvas`. Every product URL keyed on category slug silently breaks.
**Fix:** `findById` + assign + `save()`, or regenerate slug explicitly.

#### AC7. Category delete orphans every product
**File:** `server/controllers/categoryController.js:49-57`
Hard delete with no check for referencing products. Products carry a stale `category` ObjectId; subsequent edits fail Mongoose validation.
**Fix:** Block delete when `Product.countDocuments({category: id}) > 0`, or reassign products to a default category, or soft-delete via `isActive: false`.

---

### 🟠 HIGH

#### AH1. AdminProducts fetches `?limit=1000` with no pagination
**File:** `client/src/pages/admin/AdminProducts.jsx:25, 33-43, 175-181`
Loads up to 1000 products and renders them all. Beyond ~500 rows the page locks for seconds. Thumbnail decode tanks the main thread.
Worse: "Select all" toggles on `products.length` but the visual is `filteredProducts.length`. During an active search, "Select All → Delete Selected" silently deletes products that are not in view.
**Fix:** Server-side pagination + search; toggle-all operates on `filteredProducts`.

#### AH2. No price/image/variation validation in product form
**File:** `client/src/pages/admin/AdminProducts.jsx:209-213, 273-381`
- Empty price input → `Number('')` → `0` → product saved at ₹0 (schema `required` passes on `0`).
- No check that ≥1 image is uploaded.
- No orphan cleanup if admin abandons mid-edit.
**Fix:** Validate `price > 0`, require ≥1 image, warn that compare-price ≥ price.

#### AH3. Product update accepts any category ObjectId
**File:** `server/controllers/productController.js:258`
No `Category.exists({_id: req.body.category})` check before assignment.
**Fix:** Validate referenced category exists.

#### AH4. AdminOrders status dropdown allows arbitrary transitions
**File:** `client/src/pages/admin/AdminOrders.jsx:138`
Admin can move `delivered` → `pending`, skip `shipped`, etc. No confirmation. Triggers `deliveredAt` writes and delivery email.
**Fix:** Server-side allowed-transition table; UI confirm for terminal states.

#### AH5. Order delete has zero side-effects
**File:** `server/controllers/orderController.js:540-548`
`findByIdAndDelete` only. Coupon `usageHistory` stays (user is locked out of reusing). Shiprocket shipment remains. No refund initiated. No audit log.
**Fix:** Decrement coupon usage; better, archive instead of hard delete.

#### AH6. `getOrders` returns ALL orders unbounded
**File:** `server/controllers/orderController.js:431-443`
At a few thousand orders, response blows past JSON limits and admin page times out.
**Fix:** Paginate (default 50); add status filter.

#### AH7. AdminLayout shows routes to limited roles that 403 server-side
**File:** `client/src/components/admin/AdminLayout.jsx:40-46`
`order_manager` sees Dashboard, but Dashboard calls `/auth/users`, `/analytics/stats`, `/products` — all admin-only. They see four 403s and zero counts everywhere. Looks broken.
**Fix:** Either hide Dashboard from limited roles or make the Dashboard role-aware.

#### AH8. Missing `?? []` fallback can crash AdminProducts
**File:** `client/src/pages/admin/AdminProducts.jsx:25`
`setProducts(data.products)` — if the server ever returns a different shape, `.map` crashes.
**Fix:** `setProducts(data.products || [])`.

#### AH9. Login email-enumeration timing leak
**File:** `server/controllers/authController.js:319-353`
`login` only writes `loginAttempts` when the email matches a real user. Real users incur an extra `user.save()` (~10–30 ms). Attacker can probabilistically discriminate registered vs unregistered emails.
**Fix:** Always hash a dummy password when user is null, to equalize timing.

#### AH10. CSV import data integrity holes
**File:** `server/controllers/productController.js:393, 452-466, 486, 510`
- Map key is raw `name` — `"Sunset"` and `" sunset"` create two distinct products with conflicting slugs.
- Lookup uses case-insensitive regex → wrong product overwritten on update.
- Variation merge compares only `size + material` → distinct `frame`/`color` rows collapse, losing data.
- No transaction; partial commits on row failure.
- `parseNum` returns `0` for missing prices → blank-price rows silently create ₹0 products.
**Fix:** Normalize name keys (trim+lowercase); validate `price > 0`; compare full variation tuple; wrap in a Mongo session/transaction.

#### AH11. Coupon manager cannot see Marketing Partner list
**File:** `client/src/pages/admin/AdminCoupons.jsx:33-39`, `server/routes/marketing.js:19`
The page calls `/marketing/admin/users` (admin-only). `coupon_manager` gets 403 → empty dropdown. They cannot see or change `assignedTo` on a coupon.
**Fix:** Allow `coupon_manager` read-only access, or display partner name from coupon data.

#### AH12. No AbortController on any admin fetch
**File:** every admin page
Admins click between pages mid-fetch (common on Render free tier cold-starts). Resolved promises call `setState` on unmounted components. In `AdminAnalytics.jsx:58-60`, rapid range changes can let the slowest response win and overwrite the latest data.
**Fix:** `AbortController` in each `useEffect`, signal passed to `API.get`.

---

### 🟡 MEDIUM

#### AM1. `AdminLayout` Dashboard NavLink active style broken
**File:** `client/src/components/admin/AdminLayout.jsx:50`
`end={item.path === '/admin' ? 'true' : undefined}` passes string `'true'`. `end` is boolean; non-empty string evaluates truthy always.
**Fix:** `end={item.path === '/admin'}`.

#### AM2. AdminLayout — `logout` imported but never rendered
No logout button anywhere in the admin shell. To sign out, admin must navigate elsewhere.

#### AM3. AdminUsers — no pagination, no search, no filter
`API.get('/auth/users')` returns every user. At ~5k users unusable. AdminDashboard also calls this just to count `.length` — 50 MB JSON for one integer.
**Fix:** `/auth/users/count` endpoint; paginate the list.

#### AM4. Admin can demote / delete themselves
**File:** `client/src/pages/admin/AdminUsers.jsx:101-127`
No guard against self-role-change or self-delete. Site can end up with zero admins.
**Fix:** Disable dropdown/delete when `req.user._id === user._id`; enforce server-side.

#### AM5. Coupon rename — no unique check, leaks raw Mongo error
**File:** `server/controllers/couponController.js:162`
Renaming to an existing code throws E11000 → controller leaks `error.message` to the UI.
**Fix:** Pre-check uniqueness; return a clean message.

#### AM6. Coupon date input allows past expiry
**File:** `client/src/pages/admin/AdminCoupons.jsx`
No `min` on the date input; admin can save a coupon expiring yesterday.
**Fix:** `min={today}` plus server-side validation.

#### AM7. AdminOrders — no filter / search / pagination
With more than a few hundred orders, page locks. No way to find an order by `orderNumber` except Ctrl-F.

#### AM8. Order status change fires on `onChange` with no confirm
**File:** `client/src/pages/admin/AdminOrders.jsx:135`
Click → server hit → email sent. Irreversible for terminal states.
**Fix:** Confirm dialog for `delivered` / `cancelled`.

#### AM9. `optimizeImage(img.url, ...)` crashes when `url` is undefined
**File:** `client/src/pages/admin/AdminProducts.jsx:325`, `AdminAbandonedCarts.jsx:94`
After a failed upload an image entry can be `{ public_id: 'x' }` with no `url`. No guard.

#### AM10. Bulk delete sequentially awaits Cloudinary destroys
**File:** `server/controllers/productController.js:308-373`
Deleting 50 products with 10 images each holds the request for minutes. Axios `timeout: 30000` (`api.js:15`) gives up.
**Fix:** `Promise.allSettled` or queue.

#### AM11. AdminDashboard suppresses errors silently
**File:** `client/src/pages/admin/AdminDashboard.jsx:15-20`
`.catch(() => ({...}))` on every fetch. Failed `/auth/users` shows "0 users" with no toast. Admins don't know the data is stale.

#### AM12. Hard-coded subcategories in AdminProducts
**File:** `client/src/pages/admin/AdminProducts.jsx:302-310`
14 subcategories embedded in React. Adding one requires a redeploy. Category model already has `parent` field — unused.

#### AM13. Leads never marked `isRead`
**File:** `client/src/pages/admin/AdminLeads.jsx`, `server/models/Lead.js:8`
`isRead` exists in schema but no UI to toggle. Inbox grows unbounded.

#### AM14. AbandonedCart duplicates by email
**File:** `server/models/AbandonedCart.js:22`
No uniqueness constraint on email + status; two POSTs race-create duplicates.

#### AM15. No CSRF protection
JWT in `Authorization` header is mostly fine, but `CORS` is permissive (`credentials: true`). If cookies are ever introduced for admin sessions, CSRF tokens are needed.

#### AM16. No audit log for admin actions
No record of who deleted/edited/role-changed what. Hard to investigate.

#### AM17. No concurrent-edit protection
Two admins editing the same product — last write wins silently. `__v` exists but is never checked.

---

### 🟢 LOW

- **AL1** AdminLayout — no aria-current on active nav link, keyboard users lose orientation.
- **AL2** Modals across admin don't close on Escape or backdrop click (`AdminCategories.jsx:61`, `AdminCoupons.jsx:125`, `AdminProducts.jsx:266`).
- **AL3** Placeholder image uses external `via.placeholder.com` which has had outages (`AdminProducts.jsx:413`).
- **AL4** `AdminAnalytics:309` recomputes `Math.max(...)` inside the render loop — minor perf.
- **AL5** AdminUsers column "Joined" not sortable.
- **AL6** Admin pages use full-page spinners; Render cold-start can show 10+ seconds of blank. Skeleton loaders only exist in Analytics.
- **AL7** No pending-action counts in AdminLayout sidebar (unread leads, pending orders, abandoned carts) — easy productivity win.

---

## Part 3 — Cross-cutting (Auth / SEO / Performance / Security)

Most cross-cutting items are listed inline in Parts 1 & 2 (H7, H8, H9, H10, H11, H12, H13, H14, H15, M12–M15). The remaining standalone items:

#### X1. Sanitize middleware silently drops keys with dots
**File:** `server/index.js:72-83`
`if (key.includes('.')) delete obj[key]` would drop legitimate flattened keys like `shippingAddress.fullName`. Currently no client sends such payloads, but worth noting.

#### X2. Welcome / admin emails use unsanitised `${name}` inline HTML
**File:** `server/controllers/authController.js:71-74, 286-291`
Registration name with `<script>` won't run in email clients but can break rendering and spoof formatting in admin notification emails.

#### X3. Validators inversion risk
**File:** `client/src/components/auth/PasswordlessAuth.jsx:45-48`
```js
if (validators.email(identifier)) { toast.error('Invalid email format'); }
```
Correct only if `validators.email` returns truthy on **failure** — depends on internal convention. Worth verifying.

---

## Recommended Fix Order

This is the order I'd ship fixes in, ranked by **customer impact × ease of fix**:

### Day 1 (do these today)
1. **C1 / AC2** — Add `u.userId && ...` guard in `orderController.js:321`. One-line fix, currently breaks coupon reuse.
2. **AC1** — Add `HiOutlineTicket` import. One-line fix, currently crashes coupon admin on empty state.
3. **H1** — Centralize shipping threshold. Single source of truth.
4. **H4** — Gate the cart-empty redirect on a `submitted` flag. Currently races on success.
5. **AH8** — `setProducts(data.products || [])`. Defensive default.

### Week 1 (high-impact small changes)
6. **C3 + C9** — Razorpay double-spend + idempotency. Keep `loading=true` until handler/dismiss; dedupe by `paymentResult.id` server-side.
7. **C4 + C5** — Recover from payment-verify failure; never block verify on stock.
8. **C7** — Require Shiprocket webhook API key unconditionally.
9. **C8** — Move Firebase key to env var; rotate it.
10. **H8** — `app.set('trust proxy', 1)`.
11. **H9** — Raise/skip rate limit on `/analytics/track`.
12. **AC3** — Rate limit + input guard on `/coupons/validate`.
13. **AC4** — Auth/rate-limit on `/upload/canvas`.
14. **AH4 + AM8** — Order status confirm + transition validation.
15. **AC6 + AC7** — Category slug regen on rename + delete guard.

### Week 2 (medium effort, large benefit)
16. **C2 / AC5** — Implement atomic stock decrement + restore.
17. **C6** — Make ThankYou page show real order data.
18. **H2** — Decide on guest checkout (huge conversion delta).
19. **H7** — Add a React `ErrorBoundary`.
20. **H10** — Code-split admin / checkout / blog routes with `React.lazy`.
21. **H11** — Sanitize product description.
22. **H13** — Add Mongo indexes (Product, Order, search).
23. **H15** — Migrate OTP/registration sessions to Mongo or Redis.
24. **AH1 / AH6 / AM3 / AM7** — Pagination on Products / Orders / Users.
25. **AH10** — Wrap CSV import in a Mongo transaction; tighten variation merge.
26. **AH12** — AbortControllers on admin fetches.

### Backlog
- All remaining MEDIUM and LOW items above.

---

## Quick-Win Inventory (1-line / 1-file fixes)

| ID | File:line | Change |
|---|---|---|
| C1 | `server/controllers/orderController.js:321` | Add `u.userId && ...` guard |
| AC1 | `client/src/pages/admin/AdminCoupons.jsx:3` | Add `HiOutlineTicket` to import |
| AM1 | `client/src/components/admin/AdminLayout.jsx:50` | `end={item.path === '/admin'}` |
| AH8 | `client/src/pages/admin/AdminProducts.jsx:25` | `setProducts(data.products \|\| [])` |
| H8 | `server/index.js` | `app.set('trust proxy', 1)` |
| M14 | `client/src/App.jsx:73` | `crypto.randomUUID()` |
| M6 | `client/src/pages/CheckoutPage.jsx:248` | Clear `couponError` in onChange |
| H12 | `client/src/pages/NotFoundPage.jsx:52` | Move `<meta noindex>` inside `<Helmet>` |

---

*End of report.*
