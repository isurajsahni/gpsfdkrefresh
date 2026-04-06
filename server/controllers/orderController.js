const Order = require('../models/Order');
const Coupon = require('../models/Coupon');
const Product = require('../models/Product');
const sendEmail = require('../utils/sendEmail');
const emailTemplates = require('../utils/orderEmailTemplates');
const shiprocket = require('../utils/shiprocket');

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
      pending: `Your Order is Confirmed 🎉 - ${order.orderNumber}`,
      processing: `Order Being Prepared ⚙️ - ${order.orderNumber}`,
      shipped: `Your Order Has Been Shipped 🚚 - ${order.orderNumber}`,
      delivered: `Order Delivered ✅ - ${order.orderNumber}`,
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

    const productListHtml = order.items.map(item => `
      <div style="margin-bottom: 10px;">
        <img src="${item.image}" alt="${item.name}" width="50" height="50" style="border-radius: 4px; object-fit: cover; vertical-align: middle; margin-right: 10px;" />
        <span style="display: inline-block; vertical-align: middle;">
          <strong><a href="${process.env.CLIENT_URL}/product/${item.product?.slug || ''}">${item.name}</a></strong><br/>
          Qty: ${item.quantity} | Price: ₹${item.price}
        </span>
      </div>
    `).join('');

    // Send Admin Alert (immediately, doesn't need AWB)
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

    // ─── Shiprocket Integration ───
    // Automatically create shipment for Prepaid (isPaid: true) OR COD
    // IMPORTANT: Run Shiprocket BEFORE sending customer email so AWB is included
    if (order.isPaid || order.paymentMethod === 'cod') {
      try {
        console.log(`[Shiprocket] Starting automation for order: ${order.orderNumber} (isPaid: ${order.isPaid}, paymentMethod: ${order.paymentMethod})`);
        // Weight & dimensions are auto-calculated from item variation size
        // via weightMapping.js — no need to populate product weight fields

        const shipData = await shiprocket.createShipment(order);
        
        if (shipData && shipData.shipment_id) {
          order.shipmentId = shipData.shipment_id;
          order.awbCode = shipData.awb_code || '';
          order.courierName = shipData.courier_name || '';
          await order.save();
          console.log(`✅ [Shiprocket] Order created: ${order.orderNumber}, Shipment ID: ${order.shipmentId}, AWB: ${order.awbCode || 'pending'}`);
        } else if (shipData && shipData.order_id) {
          // Shiprocket accepted the order but hasn't assigned shipment yet
          console.log(`⚠️ [Shiprocket] Order ${order.orderNumber} accepted (SR Order ID: ${shipData.order_id}) but no shipment_id yet. Full response:`, JSON.stringify(shipData));
        } else {
          console.error(`❌ [Shiprocket] Unexpected response for ${order.orderNumber}:`, JSON.stringify(shipData));
        }
      } catch (shipErr) {
        console.error(`❌ [Shiprocket] Automation FAILED for ${order.orderNumber}:`, shipErr.message);
        // We still have the internal order, so admin can manually retry in Shiprocket panel.
      }
    } else {
      console.log(`[Shiprocket] Skipping for order ${order.orderNumber} — isPaid: ${order.isPaid}, paymentMethod: ${order.paymentMethod}`);
    }

    // ─── Send Customer Confirmation Email ───
    // Sent AFTER Shiprocket so the order object now has AWB/tracking data
    sendOrderEmail(order, 'pending');

  } catch (err) {
    console.error('Failed to trigger order notifications:', err.message);
  }
};

// Export trigger for paymentController
exports.triggerNewOrderNotifications = triggerNewOrderNotifications;

// ─── SERVER-SIDE PRICE CALCULATION ───
// Recalculate all prices from the database to prevent price manipulation
const calculateOrderPrices = async (items, couponCode, userId) => {
  let calculatedItemsPrice = 0;
  const verifiedItems = [];

  for (const item of items) {
    const product = await Product.findById(item.product);
    if (!product) throw new Error(`Product not found: ${item.product}`);
    if (!product.isActive) throw new Error(`Product is not available: ${product.name}`);

    // Find matching variation by ID or by attributes
    let variation;
    if (item.variationId) {
      variation = product.variations.id(item.variationId);
    }
    if (!variation && item.variation) {
      variation = product.variations.find(v =>
        v.size === item.variation?.size &&
        (!item.variation?.material || v.material === item.variation?.material) &&
        (!item.variation?.frame || v.frame === item.variation?.frame) &&
        (!item.variation?.color || v.color === item.variation?.color)
      );
    }
    if (!variation) throw new Error(`Invalid variation for ${product.name}`);

    // Check stock
    if (variation.stock < item.quantity) {
      throw new Error(`Insufficient stock for ${product.name} (${variation.size})`);
    }

    const serverPrice = variation.price;
    calculatedItemsPrice += serverPrice * item.quantity;

    verifiedItems.push({
      product: product._id,
      name: product.name,
      image: item.image,
      variation: {
        material: variation.material,
        frame: variation.frame,
        size: variation.size,
        color: variation.color,
      },
      customText: item.customText || '',
      price: serverPrice,
      quantity: item.quantity,
    });
  }

  // 1. Calculate Subtotal (Items Price)
  // ... already calculated in the loop above: calculatedItemsPrice

  // 2. Determine Shipping based on ORIGINAL Subtotal (before discount)
  // Rule: If subtotal >= ₹999 -> FREE, else ₹50
  const shippingPrice = calculatedItemsPrice >= 999 ? 0 : 50;
  const taxPrice = 0;
  let discountPrice = 0;

  // 3. Apply Coupon Discount (Capped and Validated)
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
    if (coupon && (!coupon.expiryDate || new Date() <= new Date(coupon.expiryDate))) {
      // Check min order value against itemsPrice
      if (calculatedItemsPrice >= coupon.minOrderValue) {
        if (coupon.discountType === 'percentage') {
          discountPrice = (calculatedItemsPrice * coupon.discountValue) / 100;
          // Apply percentage cap
          if (coupon.maxDiscountAmount > 0 && discountPrice > coupon.maxDiscountAmount) {
            discountPrice = coupon.maxDiscountAmount;
          }
        } else {
          discountPrice = coupon.discountValue;
        }
        
        // FINAL SAFETY: Discount must NOT exceed subtotal
        discountPrice = Math.min(discountPrice, calculatedItemsPrice);
      }
    }
  }

  // 4. Calculate Final Total (Never negative)
  const totalPrice = Math.max(calculatedItemsPrice + shippingPrice + taxPrice - discountPrice, 0);

  return {
    verifiedItems,
    itemsPrice: calculatedItemsPrice,
    shippingPrice,
    taxPrice,
    discountPrice,
    totalPrice,
  };
};


// POST /api/orders (logged-in users)
exports.createOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress, billingAddress, paymentMethod, couponCode } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ message: 'No order items' });

    // Server-side price calculation — never trust client prices
    const prices = await calculateOrderPrices(items, couponCode, req.user._id);

    // If total price is 0 (after coupons), skip payment gateway logic
    const finalPaymentMethod = prices.totalPrice === 0 ? 'free' : paymentMethod;
    const isPaid = prices.totalPrice === 0;

    const order = await Order.create({
      user: req.user._id,
      items: prices.verifiedItems,
      shippingAddress,
      billingAddress,
      paymentMethod: finalPaymentMethod,
      itemsPrice: prices.itemsPrice,
      shippingPrice: prices.shippingPrice,
      taxPrice: prices.taxPrice,
      discountPrice: prices.discountPrice,
      couponCode: couponCode || null,
      totalPrice: prices.totalPrice,
      status: (finalPaymentMethod === 'cod' || finalPaymentMethod === 'free') ? 'pending' : 'payment_pending',
      isPaid,
      paidAt: isPaid ? Date.now() : null,
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

    // Notify immediately for COD or FREE orders
    if (finalPaymentMethod === 'cod' || finalPaymentMethod === 'free') {
      triggerNewOrderNotifications(order);
    }


    res.status(201).json(order);
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('not available') || error.message.includes('Invalid variation') || error.message.includes('Insufficient stock')) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};

// POST /api/orders/guest (guest checkout — no login required)
exports.createGuestOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress, billingAddress, paymentMethod, couponCode, guestEmail, guestPhone } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ message: 'No order items' });
    if (!guestEmail && !guestPhone) return res.status(400).json({ message: 'Please provide email or phone number' });

    // Server-side price calculation — never trust client prices
    // Support coupons for guests too for production-ready feature
    const prices = await calculateOrderPrices(items, couponCode, null);


    // If total price is 0, skip payment gateway
    const finalPaymentMethod = prices.totalPrice === 0 ? 'free' : paymentMethod;
    const isPaid = prices.totalPrice === 0;

    const order = await Order.create({
      guestEmail: guestEmail || '',
      guestPhone: guestPhone || shippingAddress?.phone || '',
      items: prices.verifiedItems,
      shippingAddress,
      billingAddress,
      paymentMethod: finalPaymentMethod,
      itemsPrice: prices.itemsPrice,
      shippingPrice: prices.shippingPrice,
      taxPrice: prices.taxPrice,
      discountPrice: prices.discountPrice,
      couponCode: couponCode || null,
      totalPrice: prices.totalPrice,
      status: (finalPaymentMethod === 'cod' || finalPaymentMethod === 'free') ? 'pending' : 'payment_pending',
      isPaid,
      paidAt: isPaid ? Date.now() : null,
    });

    // Notify immediately for COD or FREE orders
    if (finalPaymentMethod === 'cod' || finalPaymentMethod === 'free') {
      triggerNewOrderNotifications(order);
    }


    res.status(201).json(order);
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('not available') || error.message.includes('Invalid variation') || error.message.includes('Insufficient stock')) {
      return res.status(400).json({ message: error.message });
    }
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
    if (req.user.role !== 'admin' && order.user?._id?.toString() !== req.user._id.toString()) {
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
    const order = await Order.findById(req.params.id).populate('items.product', 'slug');
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
    const order = await Order.findById(req.params.id).populate('items.product', 'slug');
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

exports.calculateOrderPrices = calculateOrderPrices;

// GET /api/orders/track
exports.trackOrder = async (req, res, next) => {
  try {
    const { orderId, contact } = req.query;
    
    if (!orderId || !contact) {
      return res.status(400).json({ message: 'Order ID and Contact (Email or Phone) are required' });
    }

    // Convert to uppercase as order numbers are uppercase
    const cleanOrderId = orderId.trim().toUpperCase();
    const cleanContact = contact.trim().toLowerCase();

    const order = await Order.findOne({ orderNumber: cleanOrderId }).populate('items.product', 'slug name image price');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found. Please check your Order ID.' });
    }

    let isValidContact = false;

    // Check Guest Email
    if (order.guestEmail && order.guestEmail.toLowerCase() === cleanContact) {
      isValidContact = true;
    }
    
    // Check Guest Phone
    if (order.guestPhone && order.guestPhone === cleanContact) {
      isValidContact = true;
    }
    
    // Check Shipping Address Phone
    if (order.shippingAddress && order.shippingAddress.phone && order.shippingAddress.phone === cleanContact) {
      isValidContact = true;
    }

    // Check Billing Address Phone
    if (order.billingAddress && order.billingAddress.phone && order.billingAddress.phone === cleanContact) {
      isValidContact = true;
    }

    // Check Registered User Email/Phone if linked
    if (!isValidContact && order.user) {
      const User = require('../models/User');
      const user = await User.findById(order.user);
      if (user) {
        if (user.email && user.email.toLowerCase() === cleanContact) isValidContact = true;
        if (user.phone && user.phone === cleanContact) isValidContact = true;
      }
    }

    if (!isValidContact) {
      return res.status(403).json({ message: 'Order found, but the provided email/phone does not match our records.' });
    }

    // Return safe/redacted data
    res.json({
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      status: order.status,
      items: order.items.map(item => ({
        name: item.name,
        image: item.image,
        quantity: item.quantity,
        price: item.price,
        variation: item.variation,
        productSlug: item.product?.slug
      })),
      shippingAddress: {
        city: order.shippingAddress?.city,
        state: order.shippingAddress?.state,
      },
      totalPrice: order.totalPrice,
      isPaid: order.isPaid,
      trackingNumber: order.trackingNumber,
      awbCode: order.awbCode,
      courierName: order.courierName,
      trackingUrl: order.trackingUrl,
      deliveredAt: order.deliveredAt,
      paymentMethod: order.paymentMethod
    });

  } catch (error) {
    next(error);
  }
};

// GET /api/orders/track-awb/:awb
exports.getShipmentTracking = async (req, res, next) => {
  try {
    const { awb } = req.params;
    if (!awb) return res.status(400).json({ message: 'AWB code is required' });

    const trackingData = await shiprocket.getTracking(awb);
    res.json(trackingData);
  } catch (error) {
    next(error);
  }
};
// GET /api/orders/shiprocket/:id (admin)
exports.getShiprocketOrderDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'Shiprocket Order ID is required' });

    const orderDetails = await shiprocket.getOrderDetails(id);
    res.json(orderDetails);
  } catch (error) {
    next(error);
  }
};
