const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');
const orderController = require('./orderController');
const { detectCountry, getCurrency } = require('../utils/geoPricing');
const metaCapi = require('../utils/metaCapi');

const PLACEHOLDER_PATTERNS = ['your_razorpay', 'placeholder', 'YOUR_'];

const isPlaceholder = (val) =>
  !val || PLACEHOLDER_PATTERNS.some((p) => val.includes(p));

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

    // ─── Geo-Pricing: Detect user's currency ───
    // NOTE: Razorpay only supports INR for Indian merchant accounts.
    // We ALWAYS charge in INR. Geo-pricing info is stored in notes for
    // reconciliation/display but the actual Razorpay order is always INR.
    const country = await detectCountry(req);
    const currency = getCurrency(country);

    // Always charge in INR (Razorpay requirement for Indian merchants)
    const chargeAmount = Math.round(prices.totalPrice * 100); // paise
    const chargeCurrency = 'INR';

    const instance = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const options = {
      amount: chargeAmount,
      currency: chargeCurrency,
      receipt: 'rcpt_' + Date.now().toString().slice(-8),
      notes: {
        inr_total: prices.totalPrice.toString(),
        geo_country: country,
        geo_currency: currency, // what the user's local currency is (for display)
      },
    };

    let order;
    try {
      order = await rzpCallWithRetry('orders.create', () => instance.orders.create(options));
    } catch (rzpErr) {
      const description = rzpErr?.error?.description || rzpErr?.message || 'Payment gateway error';
      console.error('[Razorpay] orders.create failed after retries:', rzpErr?.error || rzpErr?.message || rzpErr);
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
    
    if (expectedSign === razorpay_signature) {
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
      const prices = await calculateOrderPrices(orderData.items, orderData.couponCode, userId, guestIdentifier);
      
      // Verify the payment amount matches what we expect
      // Fetch the Razorpay order to confirm the amount paid
      const instance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
      const rzpOrder = await rzpCallWithRetry('orders.fetch', () => instance.orders.fetch(razorpay_order_id));
      
      // The Razorpay order was created with geo-pricing already applied.
      // Verify the stored INR total from the order notes matches our recalculated price.
      const storedInrTotal = parseFloat(rzpOrder.notes?.inr_total || '0');
      if (storedInrTotal > 0 && Math.abs(storedInrTotal - prices.totalPrice) > 1) {
        return res.status(400).json({ message: 'Payment verification failed: Amount mismatch', success: false });
      }

      // 2. Create the final Database Order securely
      const newOrder = await Order.create({
        user: userId,
        guestEmail: orderData.guestEmail || '',
        guestPhone: orderData.guestPhone || orderData.shippingAddress?.phone || '',
        items: prices.verifiedItems,
        shippingAddress: orderData.shippingAddress,
        billingAddress: orderData.billingAddress,
        paymentMethod: 'razorpay',
        itemsPrice: prices.itemsPrice,
        shippingPrice: prices.shippingPrice,
        taxPrice: prices.taxPrice,
        discountPrice: prices.discountPrice,
        couponCode: orderData.couponCode || null,
        totalPrice: prices.totalPrice,
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
    if (error.message.includes('not found') || error.message.includes('not available') || error.message.includes('Invalid variation') || error.message.includes('Insufficient stock') || error.message.includes('Coupon')) {
      return res.status(400).json({ message: error.message, success: false });
    }
    console.error('Razorpay Verification Error:', error);
    next(error);
  }
};
