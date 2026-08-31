# Staging backend setup (Razorpay deferred)

How to stand up the non-production backend (request #1) **without** dealing with
Razorpay test keys. You can add Razorpay later, only when you specifically need
to test the online-prepaid flow.

Branch: `staging` · repo `isurajsahni/gpsfdkrefresh`

---

## You do NOT need Razorpay to launch staging

The order pipeline works fully without any payment gateway, because the code
degrades gracefully:

- With no Razorpay keys set, `GET /api/payment-config` and the Razorpay
  endpoints return a clean **503** ("Payment gateway is not configured"). Nothing
  crashes — the online-prepaid modal simply can't open.
- **COD orders** (`paymentMethod: "cod"`) and **free orders** (a 100%-off coupon
  that brings the total to ₹0) never touch Razorpay at all. They run the whole
  real pipeline: server-side price calc, stock decrement, order record,
  confirmation + admin emails, ERP feed.

So the app team can place and verify real test orders on staging via **COD**,
which is exactly what request #1 is about — a safe place to call the order
endpoints. Razorpay test mode can be added on the same service later with no
code change.

| Flow | Works without Razorpay? |
|------|--------------------------|
| Browse catalogue, login/OTP, wishlist, reviews, addresses | ✅ Yes |
| Place a **COD** order (full pipeline) | ✅ Yes |
| Place a **free** order (100%-off coupon) | ✅ Yes |
| Online **prepaid** (card/UPI via Razorpay) | ⏸️ Deferred — returns 503 until keys are added |

---

## Part A — Scratch Mongo (MongoDB Atlas)

1. Create a **new M0 (free) cluster**, or reuse the existing cluster with a
   **new database name**. A separate cluster is cleanest.
2. **Database Access** → add a DB user (e.g. `gpsfdk_staging`) with its own
   password (different from prod).
3. **Network Access** → add `0.0.0.0/0`.
4. **Connect → Drivers** → copy the connection string and make the database name
   in the path distinct, e.g.
   `mongodb+srv://gpsfdk_staging:<pwd>@cluster0.xxxx.mongodb.net/gpsfdk_staging?retryWrites=true&w=majority`.
   That `/gpsfdk_staging` segment is your staging `MONGO_URI`.

---

## Part B — Copy the catalogue in

**Exact copy (recommended):**
```bash
mongodump --uri="<PROD_MONGO_URI>" --collection=products --collection=categories --out=./catalogue-dump
mongorestore --uri="<STAGING_MONGO_URI>" ./catalogue-dump
```
This copies the real catalogue and nothing else (no real users/orders).

**Or reseed** (also creates a seeded admin): set `MONGO_URI` to staging in
`server/.env`, ensure `NODE_ENV` is not `production`, then
`npm run seed --prefix server`.

---

## Part C — Create the Render web service

New → Web Service → same repo, then:
- **Branch:** `staging`
- **Root Directory:** `server`
- **Build Command:** `npm install`
- **Start Command:** `node index.js`
- **Auto-Deploy:** On

---

## Part D — Environment variables

### 🔑 Required (staging-specific)
| Key | Value |
|-----|-------|
| `MONGO_URI` | your scratch connection string (Part A) |
| `JWT_SECRET` | a **new** random string (don't reuse prod's) |
| `NODE_ENV` | `staging`  ← **not** `production`, or the seed script self-blocks |
| `CLIENT_URL` | the app/staging front-end origin |

`PORT` — leave unset; Render injects it.

### 🚫 Leave UNSET (this disables them safely)
- **Razorpay** — `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`. Leaving them unset is
  the whole point of this doc: prepaid returns a clean 503, COD works. Add test
  keys (`rzp_test_…`) later only when you want to test prepaid.
- **Shiprocket** — `SHIPROCKET_EMAIL`, `SHIPROCKET_PASSWORD`,
  `SHIPROCKET_PICKUP_LOCATION`, `SHIPROCKET_WEBHOOK_SECRET`. Shipment creation
  throws "not configured" and the order just marks `shiprocketSyncStatus:
  failed`. **No courier is ever booked.**
- **Meta** — `META_PIXEL_ID`, `META_CAPI_ACCESS_TOKEN`, `META_APP_SECRET`. CAPI
  logs "Skipped". **No purchase events fire.**
- **Push (FCM)** — `FCM_*`. Push sender no-ops until set.

### 📋 Copy from prod (so features work)
- `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` — uploads.
- Email: `EMAIL_HOST` / `EMAIL_PORT` / `EMAIL_USER` / `EMAIL_PASS` / `EMAIL_FROM`
  (or `RESEND_API_KEY`). Use a test inbox if preferred.
- `GEMINI_API_KEY` — chat assistant.
- `IPINFO_TOKEN` — geo detection.
- OTP login (so the app's passwordless login works): `WHATSAPP_TOKEN`,
  `PHONE_NUMBER_ID`, `WHATSAPP_OTP_TEMPLATE`, `WHATSAPP_OTP_TEMPLATE_LANG`,
  `WHATSAPP_VERIFY_TOKEN`, and/or `MSG91_AUTH_KEY`, `MSG91_TEMPLATE_ID`.
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — only if you seed (Part B).

---

## Part E — Deploy & verify (no payment needed)

1. Deploy (push to `staging` or Manual Deploy).
2. Logs should show `MongoDB Connected: …` — confirm the host is your **scratch**
   cluster, not prod.
3. Smoke tests:
   - `GET /api/products` → the copied catalogue.
   - Place a **COD** order from the app → confirm the order record, stock
     decrement and confirmation email. This proves the full pipeline with no
     Razorpay.
   - `GET /api/payment-config` → **503** is expected and correct while Razorpay
     is deferred.
4. Give the app team the base URL (their app proxies `/api`).

---

## Adding Razorpay later (optional)

When you do want to test online prepaid on staging:
1. Razorpay Dashboard → switch to **Test Mode** → **Settings → API Keys →
   Generate Test Key**.
2. Set `RAZORPAY_KEY_ID` (`rzp_test_…`) and `RAZORPAY_KEY_SECRET` on the staging
   service and redeploy.
3. Test cards move no real money. No code change is needed — the gateway
   activates as soon as the keys are present.

---

## ⚠️ Gotchas from the actual code
- **Never set `NODE_ENV=production` on staging** — `seed.js` hard-blocks and you
  won't be able to load/repair catalogue data.
- Use a **different `MONGO_URI` db name and `JWT_SECRET`** than prod, or staging
  and prod aren't isolated.
- Don't add real Shiprocket/Meta creds — test orders must not trigger real
  pickups or ad events.
