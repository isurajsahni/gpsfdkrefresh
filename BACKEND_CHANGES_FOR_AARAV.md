# Backend changes for the GPSFDK mobile app

Prepared for **Aarav Walia** · in reply to *backend-requests-for-suraj* (19 Aug 2026)
Branch: `staging` · repo `isurajsahni/gpsfdkrefresh`

This documents everything implemented from your request list, the new/changed
API surface, and the two items that still need a decision or a credential.

All new endpoints follow the existing conventions:
- Base path `/api`, JSON in/out.
- Auth is a `Bearer <JWT>` header (the same token `/auth/login` and
  `/auth/passwordless/*` already return). "Login" below means `protect`.
- Errors are `{ "message": "..." }` with a 4xx/5xx status.

---

## Status of every request

| # | Request | Status |
|---|---------|--------|
| 1 | Non-production backend | **Your side** — Render/Mongo dashboard setup. See `STAGING_SETUP.md`. **Razorpay is deferred** — staging runs without it; the app team tests the full order pipeline via **COD** / free orders (prepaid returns a clean 503 until test keys are added later). |
| 2 | `DELETE /api/auth/me` | ✅ Done — anonymises, keeps orders. |
| 3 | `source` on Order | ✅ Done — send `source` on order create. |
| 4 | Video uploads | ✅ Done — admin `POST /api/upload` now accepts mp4. |
| 5 | Address `label` | ✅ Done — send `label` on add/update address. |
| 6 | Fix assistant prompt | ✅ Already fixed earlier (commit `592ee7d`) — now grounded in live catalogue + refusal rules. No stale "Cinema/Abstract" knowledge base remains. |
| 7 | Wishlist model + endpoints | ✅ Done — `/api/wishlist`. |
| 8 | Device tokens + sender | ✅ Storage done (`/api/devices`); FCM sender built but **disabled until credentials are set** (see bottom). |
| 9 | Announcements/campaign model | ✅ Done — `/api/announcements`. |
| 10 | Review endpoints | ✅ Done — `/api/products/:id/reviews`. |

---

## 2 · Account deletion — `DELETE /api/auth/me`

Self-serve deletion (Apple 5.1.1(v)). **Anonymises, does not hard-delete**, so
the customer's orders stay intact for GST/accounting.

```
DELETE /api/auth/me
Auth: login
→ 200 { "message": "Your account has been deleted" }
```

After this call:
- The user's name/email/phone/addresses/avatar are wiped and the password is
  invalidated. Email is rewritten to `deleted-<id>@deleted.invalid`.
- The **existing token stops working immediately** — subsequent authed calls
  return `401 { "message": "Not authorized, account deleted" }`. The app should
  drop the session and return to the logged-out state on a 200 here.
- The customer can sign up again later with the same real email (it's freed).

---

## 3 · Order `source`

Send `source` in the order body on **every** create path. Accepted values:
`"web"`, `"ios"`, `"android"`. Anything else (or omitted) is stored as `"web"`.

- `POST /api/orders` — add `"source": "ios"` to the body.
- `POST /api/orders/guest` — same.
- Razorpay: put `source` **inside `orderData`** for both
  `POST /api/payments/razorpay` and `/verify` (it is read at verify time).

No response shape change — the created order now carries a `source` field.

---

## 4 · Product video upload

`POST /api/upload` (admin) now accepts an **mp4** in addition to images.

```
POST /api/upload           (admin, multipart/form-data)
field: image=<file>        // jpg/png/webp/gif OR mp4
→ 200 { "url": "https://res.cloudinary.com/.../video/upload/...mp4",
        "public_id": "gpsfdk/..." }
```

- Field name stays `image` (unchanged from the current image upload).
- Video is stored on Cloudinary with `resource_type: video`; the returned
  `{ url, public_id }` is exactly the shape `Product.videos[]` expects.
- Cap is 10 MB per file. The public `/api/upload/canvas` route is **image-only**
  (unchanged) — video uploads must go through the admin route.

> Note: there is no admin **UI** yet to attach a video to a product — that's
> app/admin front-end work. The backend now accepts it.

---

## 5 · Address `label`

`addressSchema` now has an optional `label` (string, max 30 — e.g. `"Home"`,
`"Work"`). Send it through the existing endpoints:

```
POST /api/auth/addresses         (login)   body: { ...address, "label": "Home" }
PUT  /api/auth/addresses/:id     (login)   body: { "label": "Work" }
→ 200/201  [ ...addresses ]   // each address now includes "label"
```

---

## 7 · Wishlist

Per-user, server-side, so likes sync across devices/website and survive
reinstall. All routes require login.

```
GET    /api/wishlist         → 200 [ <product>, ... ]   // full product cards, newest first
GET    /api/wishlist/ids     → 200 [ "<productId>", ... ] // cheap "is this liked?" state
POST   /api/wishlist/:productId   → 200 { "message": "Added to wishlist", "productId" }
DELETE /api/wishlist/:productId   → 200 { "message": "Removed from wishlist", "productId" }
```

- Add/remove are **idempotent** (adding a liked item or removing a non-liked
  item both return 200) — safe to fire on every heart tap.
- `404` if the product id doesn't exist; `400` for a malformed id.

---

## 8 · Device tokens + push

### Storage (live now)

```
POST   /api/devices        (login)
       body: { "token": "<fcm-token>", "platform": "ios" | "android" | "web" }
       → 201 { "message": "Device registered" }

DELETE /api/devices/:token (login)   // call on logout
       → 200 { "message": "Device unregistered" }
```

- Register is idempotent (upserted by token); re-registering refreshes owner +
  `lastSeenAt`.
- Register the token **after login** so the device is tied to the user (that's
  how a push is targeted to a person across their devices).

### Sender (built, **disabled until configured**)

The Firebase Cloud Messaging (HTTP v1) sender is in `server/utils/pushSender.js`.
Until FCM credentials are set it **no-ops** (`not_configured`) — nothing is sent
and nothing breaks. See "Enabling push" at the bottom.

Once configured, an announcement can be pushed to all installed apps by adding
`"push": true` to the create call (see #9).

---

## 9 · Announcements (app inbox)

Drives the "New launches" / offers section of the inbox.

```
GET  /api/announcements            (public)
     → 200 [ { title, body, image, link, type, publishAt, expiresAt, ... } ]
     // only active, already-published, non-expired items, newest first
```

Marketing/admin management (login + marketing or admin role):

```
GET    /api/announcements/all      → 200 [ ...all, incl. inactive/scheduled ]
POST   /api/announcements          body: { title*, body*, image?, link?, type?, isActive?, publishAt?, expiresAt?, push? }
PUT    /api/announcements/:id       body: any subset of the above
DELETE /api/announcements/:id      → 200 { "message": "Announcement removed" }
```

- `type` ∈ `launch | offer | update | general` (default `general`).
- `title` ≤ 140 chars, `body` ≤ 2000 chars.
- `publishAt` (default now) schedules ahead; `expiresAt` (optional) auto-drops it.
- `push: true` on create broadcasts it via FCM **if push is configured** —
  fire-and-forget, never blocks the create.

---

## 10 · Product reviews

```
GET    /api/products/:productId/reviews   (public)
       → 200 [ { _id, rating, comment, user: { name, avatar }, createdAt }, ... ]

POST   /api/products/:productId/reviews   (login)
       body: { "rating": 1..5, "comment": "..." }
       → 201 <review>          // one review per user; a repeat POST edits it

DELETE /api/products/:productId/reviews   (login)   // remove own review
       → 200 { "message": "Review removed" }
```

- `rating` is a whole number 1–5; `comment` ≤ 2000 chars.
- Every write recomputes `Product.rating` (1 decimal) and `Product.numReviews`,
  so the product list/detail now show real ratings.
- Reviews are open to any logged-in user (not gated on a verified purchase). Say
  the word if you want purchase-gating.

---

## Still needs a decision / credential

**Shipping rule (business decision).** The server charges ₹0 at/above ₹999,
else ₹50. The app design showed free above ₹2,000, else ₹99. The app now follows
the server (customers see what they'll be charged). If ₹2,000 is the real rule,
it's a one-line change in `orderController.calculateOrderPrices` — and the
website is currently under-charging too. Tell us the intended rule.

**Enabling push (credential).** Set on the staging (and later production) Render
service, then verify on staging:
- Firebase Console → Project settings → Service accounts → **Generate new
  private key**.
- Set **either** `FCM_SERVICE_ACCOUNT` (the whole JSON as one env value) **or**
  the three fields `FCM_PROJECT_ID`, `FCM_CLIENT_EMAIL`, `FCM_PRIVATE_KEY`
  (with `\n` for newlines).
- No code change needed — the sender activates automatically once these are
  present. It's untested against a live FCM project, so smoke-test one push on
  staging before relying on it.

---

## Not changed (on purpose)
- Admin `DELETE /api/auth/users/:id` still hard-deletes. It has the same
  order-orphaning problem as #2 did — flag it if you want it switched to
  anonymise too.
- The assistant system prompt (#6) was already fixed; left as-is.
