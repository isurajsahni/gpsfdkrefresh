const Order = require('../models/Order');
const Coupon = require('../models/Coupon');
const CouponUsage = require('../models/CouponUsage');
const Product = require('../models/Product');
const sendEmail = require('../utils/sendEmail');
const emailTemplates = require('../utils/orderEmailTemplates');
const shiprocket = require('../utils/shiprocket');
const metaCapi = require('../utils/metaCapi');
const { detectCountry } = require('../utils/geoPricing');

// Helper: send Meta CAPI Purchase event. Fire-and-forget so it never blocks
// the order response. The browser pixel fires the same event with the same
// event_id; Meta dedupes them.
const sendMetaPurchaseEvent = (req, order, prices, eventId) => {
  try {
    const ctx = metaCapi.extractClientContext(req);
    const shipping = order.shippingAddress || {};
    metaCapi.sendEvent({
      eventName: 'Purchase',
      eventId,
      eventSourceUrl: req.headers.referer || req.headers.referrer,
      userData: {
        email: order.guestEmail || req.user?.email,
        phone: order.guestPhone || shipping.phone || req.user?.phone,
        firstName: (shipping.fullName || req.user?.name || '').split(' ')[0],
        lastName: (shipping.fullName || req.user?.name || '').split(' ').slice(1).join(' '),
        city: shipping.city,
        state: shipping.state,
        zip: shipping.pincode,
        country: shipping.country || 'India',
        externalId: (req.user?._id || order._id).toString(),
        ...ctx,
      },
      customData: {
        value: prices.totalPrice,
        currency: 'INR',
        num_items: prices.verifiedItems.length,
        content_ids: prices.verifiedItems.map((i) => String(i.product)),
        content_type: 'product',
        contents: prices.verifiedItems.map((i) => ({ id: String(i.product), quantity: i.quantity, item_price: i.price })),
        order_id: order.orderNumber,
      },
    }).catch(() => {});
  } catch (_) { /* never block the order */ }
};

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
      email: process.env.ADMIN_EMAIL || 'suraj.gnimt@gmail.com',
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
    // Automatically create shipment for Prepaid orders (isPaid: true) or COD orders
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
          order.shiprocketOrderId = shipData.order_id ? String(shipData.order_id) : '';
          order.awb = shipData.awb_code ? String(shipData.awb_code) : '';
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
// Recalculate all prices from the database to prevent price manipulation.
// Also returns `stockOps` — the atomic stock-decrement instructions that the
// caller should apply once the order is confirmed (via decrementStockForOrder).
const calculateOrderPrices = async (items, couponCode, userId, guestIdentifier = null) => {
  let calculatedItemsPrice = 0;
  const verifiedItems = [];
  const stockOps = []; // [{ productId, variationId, qty }] — applied post-order

  for (const item of items) {
    let product = await Product.findById(item.product).catch(() => null);
    
    // Fallback for custom uploads: use a template product for price verification
    if (!product && item.uploadedImageUrl) {
      product = await Product.findOne({ slug: 'the-dapper-predator' });
      // If still not found, try to find any product in wall-canvas category
      if (!product) {
        product = await Product.findOne({ category: { $exists: true }, name: /Canvas/i });
      }
    }

    if (!product) throw new Error(`Product not found: ${item.product}`);
    if (!product.isActive) throw new Error(`Product is not available: ${product.name}`);

    // Find matching variation — 5-tier fallback:
    // 1. Exact variation _id  2. Embedded _id  3. Full attribute match
    // 4. Size-only match (stale cart)  5. First available variation
    const norm = (s) => (s || '').toString().trim().toLowerCase();
    let variation;

    // Tier 1: direct variation ID
    if (item.variationId) {
      try { variation = product.variations.id(item.variationId); } catch (_) {}
    }
    // Tier 2: _id embedded in the variation object
    if (!variation && item.variation?._id) {
      try { variation = product.variations.id(item.variation._id); } catch (_) {}
    }
    // Tier 3: full attribute match (case-insensitive)
    if (!variation && item.variation) {
      variation = product.variations.find(v =>
        norm(v.size) === norm(item.variation?.size) &&
        (!item.variation?.material || norm(v.material) === norm(item.variation?.material)) &&
        (!item.variation?.frame || norm(v.frame) === norm(item.variation?.frame)) &&
        (!item.variation?.color || norm(v.color) === norm(item.variation?.color))
      );
    }
    // Tier 4: size-only match (cart was stale / admin changed other attributes)
    if (!variation && item.variation?.size) {
      variation = product.variations.find(v => norm(v.size) === norm(item.variation.size));
    }
    // Tier 5: last resort — use the first variation so the order isn't blocked
    if (!variation && product.variations.length > 0) {
      variation = product.variations[0];
    }

    if (!variation) {
      throw new Error(`Invalid variation for ${product.name} — product has no variations configured`);
    }

    // Check stock (skip for custom orders as they are made to order)
    if (!item.uploadedImageUrl && variation.stock < item.quantity) {
      throw new Error(`Insufficient stock for ${product.name} (${variation.size})`);
    }

    const serverPrice = variation.price;
    calculatedItemsPrice += serverPrice * item.quantity;

    // Record the stock-decrement op the caller must run AFTER the order is
    // confirmed. Custom-print uploads are made-to-order (no inventory).
    if (!item.uploadedImageUrl && variation._id) {
      stockOps.push({
        productId: product._id,
        variationId: variation._id,
        qty: item.quantity,
      });
    }

    verifiedItems.push({
      product: product._id,
      name: item.uploadedImageUrl ? `Custom ${item.variation?.material || 'Canvas'}` : product.name,
      image: item.uploadedImageUrl || item.image,
      // Persist variationId so we can target the exact sub-doc on cancel/restock.
      variationId: variation._id,
      variation: {
        material: item.variation?.material || variation.material,
        frame: item.variation?.frame || variation.frame,
        size: item.variation?.size || variation.size,
        color: item.variation?.color || variation.color,
      },
      customText: item.customText || '',
      uploadedImageUrl: item.uploadedImageUrl || '',
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
      
      // Validate usage limits
      let isLimitReached = false;
      let limitMessage = 'Coupon is invalid';

      if (userId) {
        const userUsage = coupon.usageHistory.find(u => u.userId && u.userId.toString() === userId.toString());
        if (userUsage) {
          if (userUsage.useCount >= coupon.maxUsesPerUser) {
            isLimitReached = true;
            limitMessage = 'Coupon usage limit reached for your account';
          }
        } else {
          if (coupon.usageHistory.length >= coupon.maxUsers) {
            isLimitReached = true;
            limitMessage = 'Coupon has reached its maximum users limit';
          }
        }
      } else if (guestIdentifier) {
        const guestUsage = coupon.usageHistory.find(u => !u.userId && u.identifier && u.identifier.toLowerCase() === guestIdentifier.toLowerCase());
        if (guestUsage) {
          if (guestUsage.useCount >= coupon.maxUsesPerUser) {
            isLimitReached = true;
            limitMessage = 'Coupon usage limit reached for this contact information';
          }
        } else {
          if (coupon.usageHistory.length >= coupon.maxUsers) {
            isLimitReached = true;
            limitMessage = 'Coupon has reached its maximum users limit';
          }
        }
      } else {
        if (coupon.usageHistory.length >= coupon.maxUsers) {
          isLimitReached = true;
          limitMessage = 'Coupon has reached its maximum users limit';
        }
      }

      if (isLimitReached) {
        throw new Error(limitMessage);
      }

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
    stockOps,
    itemsPrice: calculatedItemsPrice,
    shippingPrice,
    taxPrice,
    discountPrice,
    totalPrice,
  };
};

// ─── STOCK MOVEMENT HELPERS ───
// Apply stock decrements after an order is confirmed. Atomic per-variation:
// only succeeds when stock is still >= qty. If a concurrent buyer drained it,
// we log loudly but don't throw — the customer's order is already created.
async function decrementStockForOrder(order) {
  if (!order || order.stockDecremented) return; // idempotent
  for (const item of order.items) {
    if (item.uploadedImageUrl) continue; // custom prints, no inventory
    const variationId = item.variationId;
    if (!variationId) continue;
    try {
      const result = await Product.updateOne(
        {
          _id: item.product,
          'variations._id': variationId,
          'variations.stock': { $gte: item.quantity },
        },
        { $inc: { 'variations.$.stock': -item.quantity } }
      );
      if (result.modifiedCount === 0) {
        console.warn(`[stock] Could not decrement product=${item.product} variation=${variationId} qty=${item.quantity} (stock too low or row gone)`);
      }
    } catch (err) {
      console.error('[stock] decrement error:', err.message);
    }
  }
  order.stockDecremented = true;
  try { await order.save(); } catch (err) { console.error('[stock] failed marking decremented:', err.message); }
}

// Restore stock when an order is cancelled. Only runs once per order.
async function restoreStockForOrder(order) {
  if (!order) return;
  if (!order.stockDecremented) return; // never decremented, nothing to restore
  if (order.stockRestored) return; // idempotent
  for (const item of order.items) {
    if (item.uploadedImageUrl) continue;
    const variationId = item.variationId;
    if (!variationId) continue;
    try {
      await Product.updateOne(
        { _id: item.product, 'variations._id': variationId },
        { $inc: { 'variations.$.stock': item.quantity } }
      );
    } catch (err) {
      console.error('[stock] restore error:', err.message);
    }
  }
  order.stockRestored = true;
  try { await order.save(); } catch (err) { console.error('[stock] failed marking restored:', err.message); }
}

exports.decrementStockForOrder = decrementStockForOrder;
exports.restoreStockForOrder = restoreStockForOrder;


// POST /api/orders (logged-in users)
exports.createOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress, billingAddress, paymentMethod, couponCode, eventIdPurchase } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ message: 'No order items' });

    // Server-side price calculation — never trust client prices
    const prices = await calculateOrderPrices(items, couponCode, req.user._id);

    // Enforce region check for Cash on Delivery (COD)
    if (paymentMethod === 'cod') {
      const country = await detectCountry(req);
      const isShippingToIndia = shippingAddress?.country && ['india', 'in'].includes(shippingAddress.country.toLowerCase());
      if (country !== 'IN' && !isShippingToIndia) {
        return res.status(400).json({ message: 'Cash on Delivery (COD) is only available for orders within India.' });
      }
    }

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
      status: (finalPaymentMethod === 'free' || finalPaymentMethod === 'cod') ? 'pending' : 'payment_pending',
      isPaid,
      paidAt: isPaid ? Date.now() : null,
    });


    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
      if (coupon) {
        const userUsage = coupon.usageHistory.find(u => u.userId && u.userId.toString() === req.user._id.toString());
        if (userUsage) {
          userUsage.useCount += 1;
        } else {
          coupon.usageHistory.push({ userId: req.user._id, useCount: 1 });
        }
        await coupon.save();

        // Track usage for analytics and reporting
        CouponUsage.create({
          couponId: coupon._id,
          customerId: req.user._id,
          orderId: order.orderNumber,
          orderAmount: prices.itemsPrice,
          discountAmount: prices.discountPrice,
        }).catch(err => console.error('CouponUsage tracking failed:', err.message));
      }
    }

    // Decrement stock atomically once order exists (FREE / zero-value path or COD only —
    // paid orders decrement in paymentController.verifyRazorpay after capture).
    if (finalPaymentMethod === 'free' || finalPaymentMethod === 'cod') {
      await decrementStockForOrder(order);
      triggerNewOrderNotifications(order);
      sendMetaPurchaseEvent(req, order, prices, eventIdPurchase);
    }


    res.status(201).json(order);
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('not available') || error.message.includes('Invalid variation') || error.message.includes('Insufficient stock') || error.message.includes('Coupon')) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};

// POST /api/orders/guest (guest checkout — no login required)
exports.createGuestOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress, billingAddress, paymentMethod, couponCode, guestEmail, guestPhone, eventIdPurchase } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ message: 'No order items' });
    if (!guestEmail && !guestPhone) return res.status(400).json({ message: 'Please provide email or phone number' });

    // Server-side price calculation — never trust client prices
    // Support coupons for guests too for production-ready feature
    const guestIdentifier = guestEmail || guestPhone || shippingAddress?.phone || null;
    const prices = await calculateOrderPrices(items, couponCode, null, guestIdentifier);

    // Enforce region check for Cash on Delivery (COD)
    if (paymentMethod === 'cod') {
      const country = await detectCountry(req);
      const isShippingToIndia = shippingAddress?.country && ['india', 'in'].includes(shippingAddress.country.toLowerCase());
      if (country !== 'IN' && !isShippingToIndia) {
        return res.status(400).json({ message: 'Cash on Delivery (COD) is only available for orders within India.' });
      }
    }

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
      status: (finalPaymentMethod === 'free' || finalPaymentMethod === 'cod') ? 'pending' : 'payment_pending',
      isPaid,
      paidAt: isPaid ? Date.now() : null,
    });

    // Track coupon usage for guests
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
      if (coupon) {
        if (guestIdentifier) {
          const guestUsage = coupon.usageHistory.find(u => !u.userId && u.identifier && u.identifier.toLowerCase() === guestIdentifier.toLowerCase());
          if (guestUsage) {
            guestUsage.useCount += 1;
          } else {
            coupon.usageHistory.push({ userId: null, identifier: guestIdentifier, useCount: 1 });
          }
          await coupon.save();
        }

        // Track usage for analytics and reporting (guest orders)
        CouponUsage.create({
          couponId: coupon._id,
          customerId: null,
          orderId: order.orderNumber,
          orderAmount: prices.itemsPrice,
          discountAmount: prices.discountPrice,
        }).catch(err => console.error('CouponUsage tracking failed:', err.message));
      }
    }

    // Decrement stock atomically once order exists (FREE / zero-value path or COD only —
    // paid orders decrement in paymentController.verifyRazorpay after capture).
    if (finalPaymentMethod === 'free' || finalPaymentMethod === 'cod') {
      await decrementStockForOrder(order);
      triggerNewOrderNotifications(order);
      sendMetaPurchaseEvent(req, order, prices, eventIdPurchase);
    }


    res.status(201).json(order);
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('not available') || error.message.includes('Invalid variation') || error.message.includes('Insufficient stock') || error.message.includes('Coupon')) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
};

// GET /api/orders (user's orders or all for admin/managers)
// Admin path now supports pagination + status filter so the dashboard doesn't
// blow up when there are thousands of orders. Pass ?paginate=true to opt in;
// without it the legacy unbounded shape is returned for compatibility.
exports.getOrders = async (req, res, next) => {
  try {
    const isAdmin = ['admin', 'admin_marketing', 'order_manager'].includes(req.user.role);
    const wantsAll = req.query.all === 'true' && isAdmin;

    if (wantsAll && req.query.paginate === 'true') {
      const page = Math.max(1, parseInt(req.query.page, 10) || 1);
      const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));
      const filter = {};
      if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;
      if (req.query.search) {
        // Search by orderNumber, guestEmail, or guestPhone (case-insensitive).
        // Escape regex meta-chars to prevent ReDoS / accidental wildcards.
        const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const rx = new RegExp(escape(String(req.query.search)), 'i');
        filter.$or = [
          { orderNumber: rx },
          { guestEmail: rx },
          { guestPhone: rx },
        ];
      }
      const [orders, total] = await Promise.all([
        Order.find(filter)
          .populate('user', 'name email')
          .populate('items.product', 'slug')
          .sort('-createdAt')
          .skip((page - 1) * limit)
          .limit(limit),
        Order.countDocuments(filter),
      ]);
      return res.json({
        orders,
        total,
        page,
        pageSize: limit,
        totalPages: Math.ceil(total / limit) || 1,
      });
    }

    if (wantsAll) {
      // Legacy: cap at 500 so we don't OOM by accident.
      const orders = await Order.find({}).populate('user', 'name email').populate('items.product', 'slug').sort('-createdAt').limit(500);
      return res.json(orders);
    }

    const orders = await Order.find({ user: req.user._id, status: { $ne: 'payment_pending' } })
      .populate('items.product', 'slug')
      .sort('-createdAt');
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

// GET /api/orders/:id
exports.getOrderById = async (req, res, next) => {
  try {
    // Accept either a Mongo ObjectId OR a human-readable orderNumber (e.g. "GPS-XXX").
    // The ThankYou page uses orderNumber in the URL because it's nicer for sharing
    // and doesn't expose the internal _id.
    const id = req.params.id;
    const isObjectId = /^[a-fA-F0-9]{24}$/.test(id);
    const query = isObjectId ? { _id: id } : { orderNumber: id };
    const order = await Order.findOne(query).populate('user', 'name email');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    const isManagerOrAdmin = ['admin', 'admin_marketing', 'order_manager'].includes(req.user.role);
    if (!isManagerOrAdmin && order.user?._id?.toString() !== req.user._id.toString()) {
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

    // If transitioning to 'cancelled' from a non-cancelled state, restore stock.
    if (req.body.status === 'cancelled' && previousStatus !== 'cancelled') {
      await restoreStockForOrder(order);
    }

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
    
    // Check authorization: must be admin/manager or order owner
    const isManagerOrAdmin = ['admin', 'admin_marketing', 'order_manager'].includes(req.user.role);
    if (!isManagerOrAdmin && order.user?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this order' });
    }

    if (order.status !== 'pending' && order.status !== 'processing') {
      return res.status(400).json({ message: `Order cannot be cancelled — current status is "${order.status}". Only pending or processing orders can be cancelled.` });
    }

    order.status = 'cancelled';
    await order.save();

    // Restore stock atomically (idempotent — only runs if not already restored).
    await restoreStockForOrder(order);

    // ─── Shiprocket Order Cancellation ───
    if (order.shiprocketOrderId) {
      try {
        console.log(`[Shiprocket] Attempting to cancel order ${order.orderNumber} on Shiprocket (SR Order ID: ${order.shiprocketOrderId})`);
        const cancelResult = await shiprocket.cancelOrder(order.shiprocketOrderId);
        console.log(`✅ [Shiprocket] Successfully requested cancellation for order ${order.orderNumber} in Shiprocket. Response:`, JSON.stringify(cancelResult));
      } catch (shipErr) {
        console.error(`❌ [Shiprocket] Cancellation FAILED for order ${order.orderNumber} in Shiprocket:`, shipErr.message);
        // We do not crash/block the internal order cancellation if Shiprocket API fails.
      }
    }

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
      paymentMethod: order.paymentMethod,
      trackingHistory: order.trackingHistory || [],
      lastTrackingUpdate: order.lastTrackingUpdate || null,
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
