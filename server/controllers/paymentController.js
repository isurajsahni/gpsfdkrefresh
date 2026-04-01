const Razorpay = require('razorpay');
const stripe = require('stripe');
const crypto = require('crypto');
const Order = require('../models/Order');
const orderController = require('./orderController');

// Razorpay create order
exports.createRazorpayOrder = async (req, res, next) => {
  try {
    const { amount } = req.body;
    
    if (!amount) {
      return res.status(400).json({ message: 'Amount is required' });
    }

    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency: 'INR',
      receipt: 'rcpt_' + Date.now().toString().slice(-8),
    };

    const order = await instance.orders.create(options);
    
    if (!order) {
      return res.status(500).json({ message: 'Failed to create Razorpay order' });
    }

    res.json(order);
  } catch (error) {
    console.error('Razorpay Order Error:', error);
    next(error);
  }
};

// Razorpay verify
exports.verifyRazorpay = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
    
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing payment details', success: false });
    }

    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');
    
    if (expectedSign === razorpay_signature) {
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ message: 'Order not found', success: false });
      }

      order.isPaid = true;
      order.paidAt = Date.now();
      order.status = 'pending';
      order.paymentResult = {
        id: razorpay_payment_id,
        status: 'completed',
        update_time: new Date().toISOString(),
      };
      await order.save();
      
      // Trigger notifications now that it's paid
      try {
        await orderController.triggerNewOrderNotifications(order);
      } catch (notifErr) {
        console.error('Notification Error (Silently handled):', notifErr);
      }

      res.json({ message: 'Payment verified successfully', success: true });
    } else {
      res.status(400).json({ message: 'Payment verification failed: Invalid signature', success: false });
    }
  } catch (error) {
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
