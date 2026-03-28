const Order = require('../models/Order');
const Coupon = require('../models/Coupon');
const sendEmail = require('../utils/sendEmail');
const emailTemplates = require('../utils/orderEmailTemplates');

// Helper: get customer email and name from order
const getCustomerInfo = async (order) => {
  let email = order.guestEmail;
  let name = order.shippingAddress?.fullName || 'Customer';
  
  if (order.user) {
    const User = require('../models/User');
    const user = await User.findById(order.user);
    if (user) {
      email = email || user.email;
      name = user.name || name;
    }
  }
  return { email, name };
};

// Helper: send order status email (non-blocking)
const sendOrderEmail = async (order, status) => {
  try {
    const { email, name } = await getCustomerInfo(order);
    if (!email) return;

    const templateMap = {
      pending: emailTemplates.orderPlaced,
      processing: emailTemplates.orderProcessing,
      shipped: emailTemplates.orderShipped,
      delivered: emailTemplates.orderDelivered,
      cancelled: emailTemplates.orderCancelled,
    };

    const subjectMap = {
      pending: `Order Confirmed - ${order.orderNumber}`,
      processing: `Order Being Prepared - ${order.orderNumber}`,
      shipped: `Order Shipped - ${order.orderNumber}`,
      delivered: `Order Delivered - ${order.orderNumber}`,
      cancelled: `Order Cancelled - ${order.orderNumber}`,
    };

    const template = templateMap[status];
    if (!template) return;

    await sendEmail({
      email,
      subject: subjectMap[status],
      html: template(order, name),
    });
  } catch (err) {
    console.error('Failed to send order email:', err.message);
  }
};

// Helper: trigger all "New Order" notifications (User email + Admin alert)
const triggerNewOrderNotifications = async (order) => {
  try {
    // Populate product slugs if they aren't there for the email links
    if (!order.items[0]?.product?.slug) {
      await order.populate('items.product', 'slug');
    }

    // Send customer confirmation
    sendOrderEmail(order, 'pending');

    const productListHtml = order.items.map(item => `
      <div style="margin-bottom: 10px;">
        <img src="${item.image}" alt="${item.name}" width="50" height="50" style="border-radius: 4px; object-fit: cover; vertical-align: middle; margin-right: 10px;" />
        <span style="display: inline-block; vertical-align: middle;">
          <strong><a href="${process.env.CLIENT_URL}/product/${item.product?.slug || ''}">${item.name}</a></strong><br/>
          Qty: ${item.quantity} | Price: ₹${item.price}
        </span>
      </div>
    `).join('');

    // Send Admin Alert
    sendEmail({
      email: 'suraj.gnimt@gmail.com',
      subject: `New ${order.user ? '' : 'Guest '}Order Placed - ${order.orderNumber}`,
      html: `
        <h3>New Order Received</h3>
        <p><strong>Order ID:</strong> ${order.orderNumber}</p>
        <p><strong>Customer:</strong> ${order.shippingAddress?.fullName || 'Guest'}</p>
        <p><strong>Payment Method:</strong> ${order.paymentMethod.toUpperCase()}</p>
        <p><strong>Total:</strong> ₹${order.totalPrice}</p>
        <hr/>
        <h4>Items Ordered:</h4>
        ${productListHtml}
      `
    }).catch(err => console.error('Admin order notification failed:', err.message));
  } catch (err) {
    console.error('Failed to trigger order notifications:', err.message);
  }
};

// Export trigger for paymentController
exports.triggerNewOrderNotifications = triggerNewOrderNotifications;

// POST /api/orders (logged-in users)
  exports.createOrder = async (req, res, next) => {
    try {
      const { items, shippingAddress, billingAddress, paymentMethod, itemsPrice, shippingPrice, taxPrice, discountPrice, couponCode, totalPrice } = req.body;
      if (!items || items.length === 0) return res.status(400).json({ message: 'No order items' });
      
      const order = await Order.create({
        user: req.user._id,
        items,
        shippingAddress,
        billingAddress,
        paymentMethod,
        itemsPrice,
        shippingPrice,
        taxPrice,
        discountPrice: discountPrice || 0,
        couponCode: couponCode || null,
        totalPrice,
        status: paymentMethod === 'cod' ? 'pending' : 'payment_pending',
        isPaid: false,
      });

      if (couponCode) {
        const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
        if (coupon) {
          const userUsage = coupon.usageHistory.find(u => u.userId.toString() === req.user._id.toString());
          if (userUsage) {
            userUsage.useCount += 1;
          } else {
            coupon.usageHistory.push({ userId: req.user._id, useCount: 1 });
          }
          await coupon.save();
        }
      }

      // Only notify if it's COD. Online payments wait for verification.
      if (paymentMethod === 'cod') {
        triggerNewOrderNotifications(order);
      }

      res.status(201).json(order);
  } catch (error) {
    next(error);
  }
};

// POST /api/orders/guest (guest checkout — no login required)
  exports.createGuestOrder = async (req, res, next) => {
    try {
      const { items, shippingAddress, billingAddress, paymentMethod, itemsPrice, shippingPrice, taxPrice, discountPrice, couponCode, totalPrice, guestEmail, guestPhone } = req.body;
      if (!items || items.length === 0) return res.status(400).json({ message: 'No order items' });
      if (!guestEmail && !guestPhone) return res.status(400).json({ message: 'Please provide email or phone number' });
      
      const order = await Order.create({
        guestEmail: guestEmail || '',
        guestPhone: guestPhone || shippingAddress?.phone || '',
        items,
        shippingAddress,
        billingAddress,
        paymentMethod,
        itemsPrice,
        shippingPrice,
        taxPrice,
        discountPrice: discountPrice || 0,
        couponCode: couponCode || null,
        totalPrice,
        status: paymentMethod === 'cod' ? 'pending' : 'payment_pending',
        isPaid: false,
      });

      if (couponCode) {
        const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
        if (coupon && guestEmail) {
          // Guest logic
        }
      }

      // Only notify if it's COD. Online payments wait for verification.
      if (paymentMethod === 'cod') {
        triggerNewOrderNotifications(order);
      }

      res.status(201).json(order);
  } catch (error) {
    next(error);
  }
};

// GET /api/orders (user's orders or all for admin)
exports.getOrders = async (req, res, next) => {
  try {
    let orders;
    if (req.user.role === 'admin') {
      orders = await Order.find({}).populate('user', 'name email').populate('items.product', 'slug').sort('-createdAt');
    } else {
      orders = await Order.find({ user: req.user._id, status: { $ne: 'payment_pending' } }).populate('items.product', 'slug').sort('-createdAt');
    }
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

// GET /api/orders/:id
exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (req.user.role !== 'admin' && order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    res.json(order);
  } catch (error) {
    next(error);
  }
};

// PUT /api/orders/:id (admin)
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const previousStatus = order.status;
    
    if (req.body.status) order.status = req.body.status;
    if (req.body.trackingNumber) order.trackingNumber = req.body.trackingNumber;
    if (req.body.status === 'delivered') order.deliveredAt = Date.now();
    if (req.body.isPaid !== undefined) {
      order.isPaid = req.body.isPaid;
      if (req.body.isPaid) order.paidAt = Date.now();
    }
    
    await order.save();

    // Send email if status changed
    if (req.body.status && req.body.status !== previousStatus) {
      sendOrderEmail(order, req.body.status);
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
};

// GET /api/orders/stats (admin)
exports.getOrderStats = async (req, res, next) => {
  try {
    const totalOrders = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([
      { $match: { isPaid: true } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const deliveredOrders = await Order.countDocuments({ status: 'delivered' });
    
    res.json({
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      pendingOrders,
      deliveredOrders,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/orders/:id/cancel
exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    
    // Check authorization: must be admin or order owner
    if (req.user.role !== 'admin' && order.user?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this order' });
    }

    if (order.status !== 'pending' && order.status !== 'processing') {
      return res.status(400).json({ message: 'Order cannot be cancelled at this stage' });
    }

    order.status = 'cancelled';
    await order.save();

    // Send cancellation email
    sendOrderEmail(order, 'cancelled');

    res.json({ message: 'Order cancelled successfully', order });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/orders/:id (admin)
exports.deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ message: 'Order deleted completely' });
  } catch (error) {
    next(error);
  }
};
