const Razorpay = require('razorpay');
const stripe = require('stripe');
const crypto = require('crypto');
const Order = require('../models/Order');
const orderController = require('./orderController');
const { detectCountry, getCurrency, convertPrice, roundClean, CURRENCY_CONFIG, INR_EXCHANGE_RATES } = require('../utils/geoPricing');

// Razorpay create order
exports.createRazorpayOrder = async (req, res, next) => {
  try {
    const { orderData } = req.body;
    
    if (!orderData || !orderData.items || orderData.items.length === 0) {
      return res.status(400).json({ message: 'Order data is required' });
    }

    const userId = req.user ? req.user._id : null;
    const guestIdentifier = !userId ? (orderData.guestEmail || orderData.guestPhone || orderData.shippingAddress?.phone || null) : null;
    const { calculateOrderPrices } = require('./orderController');
    const prices = await calculateOrderPrices(orderData.items, orderData.couponCode, userId, guestIdentifier);

    // ─── Geo-Pricing: Detect user's currency ───
    const country = await detectCountry(req);
    const currency = getCurrency(country);
    const isIndia = country === 'IN';

    let chargeAmount; // in smallest currency unit (paise/cents)
    let chargeCurrency = currency;

    if (isIndia || currency === 'INR') {
      // Indian customer: charge base INR price
      chargeAmount = Math.round(prices.totalPrice * 100); // paise
      chargeCurrency = 'INR';
    } else {
      // International customer: apply 10x multiplier + currency conversion
      const converted = convertPrice(prices.totalPrice, country);
      const config = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.USD;
      
      // Handle zero-decimal currencies (JPY, KRW) vs standard 2-decimal
      if (currency === 'JPY' || currency === 'KRW') {
        chargeAmount = converted.price; // no sub-unit
      } else if (currency === 'KWD' || currency === 'BHD' || currency === 'OMR') {
        chargeAmount = Math.round(converted.price * 1000); // 3-decimal currencies
      } else {
        chargeAmount = Math.round(converted.price * 100); // cents/pence/etc
      }
      chargeCurrency = currency;
    }

    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: chargeAmount,
      currency: chargeCurrency,
      receipt: 'rcpt_' + Date.now().toString().slice(-8),
      notes: {
        inr_total: prices.totalPrice.toString(),
        geo_country: country,
        geo_currency: chargeCurrency,
      },
    };

    const order = await instance.orders.create(options);
    
    if (!order) {
      return res.status(500).json({ message: 'Failed to create Razorpay order' });
    }

    res.json(order);
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('not available') || error.message.includes('Invalid variation') || error.message.includes('Insufficient stock') || error.message.includes('Coupon')) {
      return res.status(400).json({ message: error.message });
    }
    console.error('Razorpay Order Error:', error);
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
      const rzpOrder = await instance.orders.fetch(razorpay_order_id);
      
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

      // Trigger notifications now that it's paid
      try {
        await orderController.triggerNewOrderNotifications(newOrder);
      } catch (notifErr) {
        console.error('Notification Error (Silently handled):', notifErr);
      }

      res.json({ message: 'Payment verified successfully', success: true, orderId: newOrder._id });
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


// Stripe create checkout session
exports.createStripeSession = async (req, res, next) => {
  try {
    const stripeInstance = stripe(process.env.STRIPE_SECRET_KEY);
    const { items, orderId } = req.body;
    
    const session = await stripeInstance.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map(item => ({
        price_data: {
          currency: 'inr',
          product_data: { name: item.name },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/order-success?session_id={CHECKOUT_SESSION_ID}&orderId=${orderId}`,
      cancel_url: `${process.env.CLIENT_URL}/checkout`,
      metadata: { orderId },
    });
    res.json({ id: session.id, url: session.url });
  } catch (error) {
    next(error);
  }
};

// Stripe webhook
exports.stripeWebhook = async (req, res, next) => {
  try {
    const stripeInstance = stripe(process.env.STRIPE_SECRET_KEY);
    const sig = req.headers['stripe-signature'];
    const event = stripeInstance.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const orderId = session.metadata.orderId;
      const order = await Order.findById(orderId);
      if (order) {
        order.isPaid = true;
        order.paidAt = Date.now();
        order.status = 'pending';
        order.paymentResult = { id: session.payment_intent, status: 'completed', update_time: new Date().toISOString() };
        await order.save();

        // Trigger notifications now that it's paid
        orderController.triggerNewOrderNotifications(order);
      }
    }
    res.json({ received: true });
  } catch (error) {
    next(error);
  }
};
