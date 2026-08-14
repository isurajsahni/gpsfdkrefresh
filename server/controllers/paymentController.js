const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const orderController = require('./orderController');
const { detectCountry, getCurrency, getPriceMultiplier, applyPriceMultiplier } = require('../utils/geoPricing');
const metaCapi = require('../utils/metaCapi');

const PLACEHOLDER_PATTERNS = ['your_razorpay', 'placeholder', 'YOUR_'];

const isPlaceholder = (val) =>
  !val || PLACEHOLDER_PATTERNS.some((p) => val.includes(p));

// Constant-time compare for secret-derived values (here: the Razorpay HMAC
// signature). A plain `===` on strings short-circuits at the first differing
// byte, which leaks — in principle — how many leading hex chars of the expected
// HMAC a guess got right. Same helper/shape as `safeEqual` in
// routes/shiprocketWebhook.js and middleware/serviceKey.js; kept local so this
// file has no new cross-module dependency. Returns false (never throws) on
// non-strings or length mismatch, because `crypto.timingSafeEqual` requires
// two equal-length Buffers — a non-string signature (e.g. a JSON array smuggled
// in the body) must be a clean rejection, not a 500.
const safeEqual = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
};

// Razorpay's API can throw transient 5xx / network errors — most commonly on
// the FIRST call from a freshly-started (cold) Render container, before DNS/TLS
// to api.razorpay.com is warmed up. That single failure surfaced to the buyer
// as a 502 "Payment gateway error" and killed an otherwise-valid checkout.
// Creating an order moves no money, and verifyRazorpay is idempotent on the
// payment id, so retrying transient failures is completely safe. We only retry
// network errors (no statusCode) or 5xx — a 4xx (bad amount/key) is
// deterministic and retrying it would just waste the buyer's time.
const rzpCallWithRetry = async (label, fn, attempts = 3) => {
  let lastErr;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const statusCode = err?.statusCode;
      const isTransient = !statusCode || statusCode >= 500;
      console.error(
        `[Razorpay] ${label} attempt ${attempt}/${attempts} failed:`,
        JSON.stringify({
          statusCode,
          code: err?.error?.code || err?.code,
          description: err?.error?.description,
          message: err?.message,
        })
      );
      if (!isTransient || attempt === attempts) break;
      await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
    }
  }
  throw lastErr;
};

// Returns the public Razorpay key to the frontend — avoids baking VITE_* into
// the Vercel build. The key ID is public (safe to expose); the secret never leaves.
exports.getRazorpayConfig = (req, res) => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  if (isPlaceholder(keyId)) {
    console.error('[Razorpay] getRazorpayConfig: RAZORPAY_KEY_ID not set or is placeholder');
    return res.status(503).json({ message: 'Payment gateway is not configured. Contact support.' });
  }
  res.json({ keyId });
};

// Ops probe: attempts a ₹1 order create (unpaid stub, no money moves) and
// reports the outcome, so gateway failures on the host can be diagnosed
// without access to its logs. Never leaks the key secret.
//
// ADMIN-ONLY — mounted behind `protect, admin` in routes/payments.js. Two
// reasons it can never be public: the response body carries gateway internals
// (key-id prefix, gateway error code/description), and the ₹1 order it creates
// is REAL and payable, i.e. a payable order id that did not come from the
// checkout price calculation. verifyRazorpay now verifies the captured amount
// against `rzpOrder.amount` so such an order can no longer be redeemed against
// a large cart, but there is no reason to hand them out to anonymous callers.
exports.getPaymentHealth = async (req, res) => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (isPlaceholder(keyId) || isPlaceholder(keySecret)) {
    return res.status(503).json({ ok: false, reason: 'credentials missing or placeholder' });
  }
  const instance = new Razorpay({ key_id: keyId, key_secret: keySecret });
  try {
    const order = await instance.orders.create({
      amount: 100,
      currency: 'INR',
      receipt: 'health_' + Date.now().toString().slice(-8),
      notes: { purpose: 'gateway-health-probe' },
    });
    return res.json({ ok: true, orderId: order.id, keyIdPrefix: keyId.slice(0, 8) });
  } catch (err) {
    console.error('[Razorpay] health probe failed:', JSON.stringify(err, Object.getOwnPropertyNames(err || {})));
    return res.status(502).json({
      ok: false,
      keyIdPrefix: keyId.slice(0, 8),
      statusCode: err?.statusCode ?? null,
      code: err?.error?.code || err?.code || null,
      description: err?.error?.description || null,
      message: err?.message || null,
      errorKeys: Object.keys(err || {}),
    });
  }
};

// Razorpay create order
exports.createRazorpayOrder = async (req, res, next) => {
  try {
    const { orderData } = req.body;

    if (!orderData || !orderData.items || orderData.items.length === 0) {
      return res.status(400).json({ message: 'Order data is required' });
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (isPlaceholder(keyId) || isPlaceholder(keySecret)) {
      console.error('[Razorpay] createRazorpayOrder: credentials missing or placeholder');
      return res.status(503).json({ message: 'Payment gateway is not configured. Contact support.' });
    }

    const userId = req.user ? req.user._id : null;
    const guestIdentifier = !userId ? (orderData.guestEmail || orderData.guestPhone || orderData.shippingAddress?.phone || null) : null;
    const { calculateOrderPrices } = require('./orderController');
    const prices = await calculateOrderPrices(orderData.items, orderData.couponCode, userId, guestIdentifier);

    // ─── Geo-Pricing ───
    // NOTE: Razorpay only supports INR for Indian merchant accounts, so the
    // order is always denominated in INR.
    //
    // The international 10x multiplier is DELIBERATELY NOT APPLIED here.
    // It was, briefly, to close the "shown $119 / charged ~$12" gap (H-3) — but
    // the storefront decides the displayed multiplier from its own /api/pricing
    // call while this decided it from a fresh server-side geo lookup, and the
    // two can disagree: /api/pricing is served with `Cache-Control: public,
    // max-age=3600`, so a shopper (or a shared cache) can hold an INR quote
    // while the server now resolves them as international. The result was a
    // customer shown ₹499 and billed ₹4,990.
    //
    // Overcharging a real buyer 10x is far worse than under-collecting on
    // international orders, so the charge is pinned back to the quoted INR
    // total. Re-applying the multiplier requires the DISPLAYED total and the
    // CHARGED total to come from one server-side computation — see the note in
    // verifyRazorpay, which still honours the multiplier recorded on orders
    // created while it was live.
    const country = await detectCountry(req, { trusted: true });
    const currency = getCurrency(country);
    const priceMultiplier = 1;
    const chargedPrices = applyPriceMultiplier(prices, priceMultiplier);

    // Always charge in INR (Razorpay requirement for Indian merchants)
    const chargeAmount = Math.round(chargedPrices.totalPrice * 100); // paise
    const chargeCurrency = 'INR';

    const instance = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const options = {
      amount: chargeAmount,
      currency: chargeCurrency,
      receipt: 'rcpt_' + Date.now().toString().slice(-8),
      notes: {
        inr_total: chargedPrices.totalPrice.toString(),
        // Persist the multiplier ON THE RAZORPAY ORDER. Verification re-reads it
        // from here rather than re-deriving it from geo: the verify call is a
        // separate request, and if the shopper's IP resolved to a different
        // country by then (network switch, VPN toggle) a re-derived multiplier
        // would not match the captured amount — taking their money and refusing
        // to create the order. Notes are written by us and returned by
        // orders.fetch, so the client cannot influence them.
        price_multiplier: String(priceMultiplier),
        geo_country: country,
        geo_currency: currency, // what the user's local currency is (for display)
      },
    };

    let order;
    try {
      order = await rzpCallWithRetry('orders.create', () => instance.orders.create(options));
    } catch (rzpErr) {
      // The SDK normalizes network-level failures to { statusCode: undefined,
      // error: undefined } — no description/message. Include what we do know
      // in the response so failures are diagnosable without server log access.
      const description =
        rzpErr?.error?.description ||
        rzpErr?.message ||
        `Payment gateway error (${rzpErr?.statusCode || 'network'})`;
      console.error(
        '[Razorpay] orders.create failed after retries:',
        JSON.stringify(rzpErr, Object.getOwnPropertyNames(rzpErr || {}))
      );
      return res.status(502).json({ message: description });
    }

    if (!order) {
      return res.status(502).json({ message: 'Failed to create Razorpay order' });
    }

    // Server-side InitiateCheckout — dedupes with the browser pixel via eventId.
    // Fire-and-forget: never block the order on Meta's API.
    try {
      const ctx = metaCapi.extractClientContext(req);
      const shipping = orderData.shippingAddress || {};
      metaCapi.sendEvent({
        eventName: 'InitiateCheckout',
        eventId: orderData.eventIdInitiateCheckout,
        eventSourceUrl: req.headers.referer || req.headers.referrer,
        userData: {
          email: orderData.guestEmail || req.user?.email,
          phone: orderData.guestPhone || shipping.phone || req.user?.phone,
          firstName: (shipping.fullName || req.user?.name || '').split(' ')[0],
          lastName: (shipping.fullName || req.user?.name || '').split(' ').slice(1).join(' '),
          city: shipping.city,
          state: shipping.state,
          zip: shipping.pincode,
          country: shipping.country || 'India',
          externalId: req.user?._id?.toString(),
          ...ctx,
        },
        customData: {
          value: prices.totalPrice,
          currency: 'INR',
          num_items: orderData.items.length,
          content_ids: orderData.items.map((i) => i.product),
          content_type: 'product',
          contents: orderData.items.map((i) => ({ id: i.product, quantity: i.quantity, item_price: i.price })),
        },
      }).catch(() => {});
    } catch (_) { /* never block order creation */ }

    // Return the Razorpay PUBLIC key alongside the order so the client can
    // open the checkout modal without needing VITE_RAZORPAY_KEY_ID in its
    // own build env. The key_id is a public identifier — safe to expose to
    // the browser (only the secret must stay server-side).
    res.json({ ...order, key: keyId });
  } catch (error) {
    if (
      error.message.includes('not found') ||
      error.message.includes('not available') ||
      error.message.includes('Invalid variation') ||
      error.message.includes('Invalid quantity') ||
      error.message.includes('Insufficient stock') ||
      error.message.includes('Coupon')
    ) {
      return res.status(400).json({ message: error.message });
    }
    console.error('[Razorpay] createRazorpayOrder unexpected error:', error);
    next(error);
  }
};

// Razorpay verify
exports.verifyRazorpay = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderData } = req.body;
    
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderData) {
      return res.status(400).json({ message: 'Missing payment details or order data', success: false });
    }

    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');
    
    if (safeEqual(expectedSign, razorpay_signature)) {
      // 0. IDEMPOTENCY — if this payment has already been recorded as an order
      // (e.g., the user double-clicked, the network retried, or Razorpay redelivered
      // a webhook), short-circuit and return the existing order. This prevents
      // duplicate orders, duplicate Shiprocket shipments, and duplicate emails.
      const existing = await Order.findOne({ 'paymentResult.id': razorpay_payment_id });
      if (existing) {
        return res.json({
          message: 'Payment already verified',
          success: true,
          orderId: existing._id,
          orderNumber: existing.orderNumber,
          duplicate: true,
        });
      }

      // 1. Verify exact price to prevent tampering
      const userId = req.user ? req.user._id : null;
      const guestIdentifier = !userId ? (orderData.guestEmail || orderData.guestPhone || orderData.shippingAddress?.phone || null) : null;
      const { calculateOrderPrices } = require('./orderController');
      // Payment is already captured — allowOversell ensures a product that went
      // low-stock/inactive between checkout and capture can't block order creation
      // and strand the customer's money with no order (F1).
      const prices = await calculateOrderPrices(orderData.items, orderData.couponCode, userId, guestIdentifier, { allowOversell: true });
      
      // Verify the payment amount matches what we expect
      // Fetch the Razorpay order to confirm the amount paid
      const instance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
      const rzpOrder = await rzpCallWithRetry('orders.fetch', () => instance.orders.fetch(razorpay_order_id));
      
      // ─── Amount verification — fails CLOSED ───
      // `rzpOrder.amount` (paise) is the figure Razorpay itself holds for this
      // order. createRazorpayOrder derived it from a server-side price
      // calculation, so the client can never influence it. It is the
      // authoritative amount; `notes.inr_total` is only a convenience copy.
      //
      // This check used to key SOLELY off `notes.inr_total`, and skipped
      // verification entirely when that note was missing or "0". Every order
      // minted by createRazorpayOrder carries the note, which made the skip look
      // harmless — but createRazorpayOrder is not the only thing minting
      // payable orders on this key. The /api/payment-health probe mints a real
      // ₹1 order whose notes are `{ purpose: 'gateway-health-probe' }` with no
      // inr_total. Anyone holding such an order id could pay ₹1 through the
      // public checkout, receive a genuine Razorpay signature for it, and POST
      // that to /verify-payment with an arbitrarily large cart: the note was
      // absent, the amount check was skipped, and a ₹4,000 order was created
      // for ₹1. Comparing against `amount` closes that for good, regardless of
      // what notes any out-of-band order happens to carry.
      //
      // Why this is safe for real buyers: for an order created by
      // createRazorpayOrder, `amount === round(inr_total * 100)` by
      // construction, so any checkout that passed the old note comparison
      // passes this one identically. The ±₹1 tolerance is preserved so
      // sub-rupee rounding drift between checkout and verification still goes
      // through. The only newly-rejected requests are ones whose captured
      // amount genuinely does not match the cart being claimed.
      //
      // The currency guard exists because comparing paise across currencies is
      // meaningless: createRazorpayOrder hardcodes INR (Razorpay only supports
      // INR for Indian merchant accounts — see the geo-pricing note there), so
      // a non-INR order here cannot have come from our checkout.
      // International orders are charged `base * multiplier` (see
      // createRazorpayOrder). Recover that multiplier from the note WE wrote on
      // the Razorpay order rather than re-deriving it from the caller's geo —
      // this request may resolve to a different country than the one that priced
      // the order, and a mismatch here would capture the payment then refuse to
      // create the order. Absent/legacy note ⇒ 1, i.e. previous behaviour.
      const orderMultiplier = Number(rzpOrder?.notes?.price_multiplier) || 1;
      const expectedPrices = applyPriceMultiplier(prices, orderMultiplier);
      const expectedTotal = expectedPrices.totalPrice;

      const paidCurrency = (rzpOrder?.currency || 'INR').toUpperCase();
      const paidInr = Number(rzpOrder?.amount) / 100;
      if (
        paidCurrency !== 'INR' ||
        !Number.isFinite(paidInr) ||
        paidInr <= 0 ||
        Math.abs(paidInr - expectedTotal) > 1
      ) {
        console.error(
          '[Razorpay] verify: amount/currency mismatch — refusing to create order:',
          JSON.stringify({
            razorpay_order_id,
            razorpay_payment_id,
            orderAmountPaise: rzpOrder?.amount ?? null,
            orderCurrency: rzpOrder?.currency ?? null,
            recalculatedTotal: expectedTotal,
            priceMultiplier: orderMultiplier,
          })
        );
        return res.status(400).json({ message: 'Payment verification failed: Amount mismatch', success: false });
      }

      // Secondary cross-check against the note written at order creation. Kept
      // as defence in depth (it would catch an order whose amount was somehow
      // right but whose recorded INR total was not); still advisory-only when
      // the note is absent, since the authoritative check above already ran.
      const storedInrTotal = parseFloat(rzpOrder.notes?.inr_total || '0');
      if (storedInrTotal > 0 && Math.abs(storedInrTotal - expectedTotal) > 1) {
        return res.status(400).json({ message: 'Payment verification failed: Amount mismatch', success: false });
      }

      // ─── Capture state: LOG ONLY, never a rejection ───
      // Deliberate decision, do not "harden" this into a hard 400. A valid
      // signature is itself proof that Razorpay processed a successful payment
      // on this order (only Razorpay can produce the HMAC), so an unpaid order
      // cannot reach this point anyway. Meanwhile `status` legitimately lags or
      // sits at 'attempted' when the account/payment is on manual capture
      // (authorized, captured later) or when the fetch races the capture
      // propagating. Rejecting on that would take the buyer's money and create
      // no order — the exact failure this whole path is built to avoid (F1).
      // So we record the anomaly for reconciliation and continue.
      if (rzpOrder?.status !== 'paid' || Number(rzpOrder?.amount_paid) < Number(rzpOrder?.amount)) {
        console.warn(
          '[Razorpay] verify: signature valid but order not shown as fully paid — proceeding anyway:',
          JSON.stringify({
            razorpay_order_id,
            razorpay_payment_id,
            status: rzpOrder?.status ?? null,
            amount: rzpOrder?.amount ?? null,
            amount_paid: rzpOrder?.amount_paid ?? null,
          })
        );
      }

      // 2. Create the final Database Order securely
      const newOrder = await Order.create({
        user: userId,
        guestEmail: orderData.guestEmail || '',
        guestPhone: orderData.guestPhone || orderData.shippingAddress?.phone || '',
        // Record the amounts actually CHARGED (base × multiplier), so the order,
        // the invoice/emails and the money captured all agree.
        items: expectedPrices.verifiedItems,
        shippingAddress: orderData.shippingAddress,
        billingAddress: orderData.billingAddress,
        paymentMethod: 'razorpay',
        itemsPrice: expectedPrices.itemsPrice,
        shippingPrice: expectedPrices.shippingPrice,
        taxPrice: expectedPrices.taxPrice,
        discountPrice: expectedPrices.discountPrice,
        couponCode: orderData.couponCode || null,
        totalPrice: expectedTotal,
        status: 'pending',
        isPaid: true,
        paidAt: Date.now(),
        paymentResult: {
          id: razorpay_payment_id,
          status: 'completed',
          update_time: new Date().toISOString(),
        }
      });

      // Handle coupon usage
      if (orderData.couponCode) {
        const Coupon = require('../models/Coupon');
        const coupon = await Coupon.findOne({ code: orderData.couponCode.toUpperCase() });
        if (coupon) {
          if (userId) {
            const userUsage = coupon.usageHistory.find(u => u.userId && u.userId.toString() === userId.toString());
            if (userUsage) {
              userUsage.useCount += 1;
            } else {
              coupon.usageHistory.push({ userId: userId, useCount: 1 });
            }
          } else if (guestIdentifier) {
            const guestUsage = coupon.usageHistory.find(u => !u.userId && u.identifier && u.identifier.toLowerCase() === guestIdentifier.toLowerCase());
            if (guestUsage) {
              guestUsage.useCount += 1;
            } else {
              coupon.usageHistory.push({ userId: null, identifier: guestIdentifier, useCount: 1 });
            }
          }
          await coupon.save();
        }
      }

      // Decrement stock atomically now that payment is captured.
      try {
        await orderController.decrementStockForOrder(newOrder);
      } catch (stockErr) {
        console.error('Stock Decrement Error (Silently handled):', stockErr);
      }

      // Trigger notifications now that it's paid
      try {
        await orderController.triggerNewOrderNotifications(newOrder);
      } catch (notifErr) {
        console.error('Notification Error (Silently handled):', notifErr);
      }

      // Meta Conversions API — server-side Purchase event. This is the
      // authoritative signal: it fires only after the DB write succeeds, so
      // Meta's reported revenue stays in sync with real orders. The browser
      // pixel fires the same event with the same event_id; Meta dedupes.
      try {
        const ctx = metaCapi.extractClientContext(req);
        const shipping = orderData.shippingAddress || {};
        metaCapi.sendEvent({
          eventName: 'Purchase',
          eventId: orderData.eventIdPurchase,
          eventSourceUrl: req.headers.referer || req.headers.referrer,
          userData: {
            email: newOrder.guestEmail || req.user?.email,
            phone: newOrder.guestPhone || shipping.phone || req.user?.phone,
            firstName: (shipping.fullName || req.user?.name || '').split(' ')[0],
            lastName: (shipping.fullName || req.user?.name || '').split(' ').slice(1).join(' '),
            city: shipping.city,
            state: shipping.state,
            zip: shipping.pincode,
            country: shipping.country || 'India',
            externalId: (req.user?._id || newOrder._id).toString(),
            ...ctx,
          },
          customData: {
            value: prices.totalPrice,
            currency: 'INR',
            num_items: prices.verifiedItems.length,
            content_ids: prices.verifiedItems.map((i) => String(i.product)),
            content_type: 'product',
            contents: prices.verifiedItems.map((i) => ({ id: String(i.product), quantity: i.quantity, item_price: i.price })),
            order_id: newOrder.orderNumber,
          },
        }).catch(() => {});
      } catch (_) { /* never block the order response */ }

      res.json({ message: 'Payment verified successfully', success: true, orderId: newOrder._id, orderNumber: newOrder.orderNumber });
    } else {
      res.status(400).json({ message: 'Payment verification failed: Invalid signature', success: false });
    }
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('not available') || error.message.includes('Invalid variation') || error.message.includes('Invalid quantity') || error.message.includes('Insufficient stock') || error.message.includes('Coupon')) {
      return res.status(400).json({ message: error.message, success: false });
    }
    console.error('Razorpay Verification Error:', error);
    next(error);
  }
};
