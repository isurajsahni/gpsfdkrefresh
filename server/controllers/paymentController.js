const Razorpay = require('razorpay');
const stripe = require('stripe');
const crypto = require('crypto');
const Order = require('../models/Order');

// Razorpay create order
exports.createRazorpayOrder = async (req, res) => {
  try {
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    const options = {
      amount: req.body.amount * 100,
      currency: 'INR',
      receipt: 'receipt_' + Date.now(),
    };
    const order = await instance.orders.create(options);
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Razorpay verify
exports.verifyRazorpay = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(sign).digest('hex');
    
    if (expectedSign === razorpay_signature) {
      const order = await Order.findById(orderId);
      if (order) {
        order.isPaid = true;
        order.paidAt = Date.now();
        order.paymentResult = {
          id: razorpay_payment_id,
          status: 'completed',
          update_time: new Date().toISOString(),
        };
        await order.save();
      }
      res.json({ message: 'Payment verified', success: true });
    } else {
      res.status(400).json({ message: 'Invalid signature', success: false });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Stripe create checkout session
exports.createStripeSession = async (req, res) => {
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
    res.status(500).json({ message: error.message });
  }
};

// Stripe webhook
exports.stripeWebhook = async (req, res) => {
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
        order.paymentResult = { id: session.payment_intent, status: 'completed', update_time: new Date().toISOString() };
        await order.save();
      }
    }
    res.json({ received: true });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
