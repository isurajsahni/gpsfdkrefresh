const Order = require('../models/Order');
const Coupon = require('../models/Coupon');
const CouponUsage = require('../models/CouponUsage');
const Product = require('../models/Product');
const sendEmail = require('../utils/sendEmail');
const emailTemplates = require('../utils/orderEmailTemplates');
const shiprocket = require('../utils/shiprocket');
const metaCapi = require('../utils/metaCapi');
const erp = require('../utils/erpWebhook');
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

        const shipData = await shiprocket.createShipment(order);
        
        if (shipData && (shipData.shipment_id || shipData.order_id)) {
          order.shipmentId = shipData.shipment_id ? String(shipData.shipment_id) : '';
          order.shiprocketOrderId = shipData.order_id ? String(shipData.order_id) : '';
          order.awbCode = shipData.awb_code || '';
          order.awb = shipData.awb_code ? String(shipData.awb_code) : '';
          order.courierName = shipData.courier_name || '';
          order.shiprocketSyncStatus = 'synced';
          order.shiprocketError = '';
          await order.save();
          console.log(`✅ [Shiprocket] Order created: ${order.orderNumber}, SR Order ID: ${order.shiprocketOrderId}, Shipment ID: ${order.shipmentId || 'pending'}, AWB: ${order.awbCode || 'pending'}`);
        } else {
          console.error(`❌ [Shiprocket] Unexpected response for ${order.orderNumber}:`, JSON.stringify(shipData));
          order.shiprocketSyncStatus = 'failed';
          order.shiprocketError = `Unexpected response from Shiprocket API: ${JSON.stringify(shipData)}`;
          await order.save();
        }
      } catch (shipErr) {
        console.error(`❌ [Shiprocket] Automation FAILED for ${order.orderNumber}:`, shipErr.message);
        order.shiprocketSyncStatus = 'failed';
        order.shiprocketError = shipErr.message || 'Shiprocket API call failed';
        await order.save().catch(saveErr => console.error('Failed saving shiprocket failure state:', saveErr.message));
      }
    } else {
      console.log(`[Shiprocket] Skipping for order ${order.orderNumber} — isPaid: ${order.isPaid}, paymentMethod: ${order.paymentMethod}`);
    }

    // ─── Send Customer Confirmation Email ───
    // Sent AFTER Shiprocket so the order object now has AWB/tracking data
    sendOrderEmail(order, 'pending');

    // ─── ERP push (fire-and-forget, opt-in) ───
    // After Shiprocket so the pushed payload carries AWB/courier if assigned.
    erp.sendOrderEvent('order.created', order);

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
// Per-item sanity cap. Deliberately generous — this is not the security control
// (that is the `>= 1` integer check below); it just stops absurd orders.
const MAX_ITEM_QUANTITY = 100;

// `options.allowOversell` is set by the post-payment path (verifyRazorpay): once
// Razorpay has captured the money we MUST create the order, so a product that went
// inactive or out of stock in the seconds between checkout and payment can no longer
// be a hard error — that would charge the customer and create no order. Prices are
// still recalculated from the DB; only the availability *blocks* are relaxed.
const calculateOrderPrices = async (items, couponCode, userId, guestIdentifier = null, options = {}) => {
  const { allowOversell = false } = options;
  let calculatedItemsPrice = 0;
  const verifiedItems = [];
  const stockOps = []; // [{ productId, variationId, qty }] — applied post-order

  for (const item of items) {
    // ─── Validate quantity BEFORE it reaches any arithmetic ───
    // `quantity` comes straight from the request body. Unvalidated, a negative
    // value drives the subtotal negative; `Math.max(total, 0)` then clamps it to
    // exactly 0, and a 0 total is treated as a fully-paid free order. The same
    // value is later fed to the stock decrement, where `$gte: quantity` is
    // trivially true for negatives and `$inc: -quantity` *raises* stock.
    // This is the single choke point for every order path (createOrder,
    // createGuestOrder, createRazorpayOrder, verifyRazorpay), so validating
    // here covers all of them.
    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new Error(`Invalid quantity: each item must have a whole quantity of at least 1`);
    }
    // Upper bound is a sanity guard, not a security control, so it is relaxed
    // post-payment for the same reason as the stock check above — never strand a
    // captured payment. Tampering is still caught by the amount comparison in
    // verifyRazorpay, which comes from the Razorpay order, not the request.
    if (quantity > MAX_ITEM_QUANTITY) {
      if (!allowOversell) {
        throw new Error(`Invalid quantity: at most ${MAX_ITEM_QUANTITY} units per item`);
      }
      console.warn(`[quantity] Post-payment order exceeds per-item cap: product=${item.product} qty=${quantity}`);
    }

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
    if (!product.isActive && !allowOversell) throw new Error(`Product is not available: ${product.name}`);

    // Find matching variation — 5-tier fallback:
    // 1. Exact variation _id  2. Embedded _id  3. Full attribute match
    // 4. Size-only match (stale cart)  5. First available variation
    // Strip ALL whitespace, not just outer: the customize page labels sizes
    // "24 x 36" while product variations store "24x36" — trim-only matching
    // sent every custom order to tier 5 (first variation = cheapest price).
    const norm = (s) => (s || '').toString().toLowerCase().replace(/\s+/g, '');
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

    // Check stock (skip for custom orders as they are made to order).
    // Post-payment (allowOversell) we record the order anyway and let the atomic
    // decrement no-op — overselling is a fulfilment problem, not a reason to keep
    // a paying customer's money with no order.
    if (!item.uploadedImageUrl && variation.stock < quantity) {
      if (!allowOversell) {
        throw new Error(`Insufficient stock for ${product.name} (${variation.size})`);
      }
      console.warn(`[oversell] Order proceeding post-payment despite low stock: product=${product._id} variation=${variation.size} need=${quantity} have=${variation.stock}`);
    }

    const serverPrice = variation.price;
    calculatedItemsPrice += serverPrice * quantity;

    // Record the stock-decrement op the caller must run AFTER the order is
    // confirmed. Custom-print uploads are made-to-order (no inventory).
    if (!item.uploadedImageUrl && variation._id) {
      stockOps.push({
        productId: product._id,
        variationId: variation._id,
        qty: quantity,
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
      // Cost snapshot from the DB variation (never client-supplied); plays no
      // part in totals so it can never change what the customer pays.
      costPrice: variation.costPrice || 0,
      quantity,
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
    if (error.message.includes('not found') || error.message.includes('not available') || error.message.includes('Invalid variation') || error.message.includes('Invalid quantity') || error.message.includes('Insufficient stock') || error.message.includes('Coupon')) {
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
    if (error.message.includes('not found') || error.message.includes('not available') || error.message.includes('Invalid variation') || error.message.includes('Invalid quantity') || error.message.includes('Insufficient stock') || error.message.includes('Coupon')) {
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
    const nextStatus = req.body.status;

    if (nextStatus) order.status = nextStatus;
    if (req.body.trackingNumber) order.trackingNumber = req.body.trackingNumber;
    if (nextStatus === 'delivered') order.deliveredAt = Date.now();
    if (req.body.isPaid !== undefined) {
      order.isPaid = req.body.isPaid;
      if (req.body.isPaid) order.paidAt = Date.now();
    }

    // ─── Email idempotency (shared with the Shiprocket webhook) ───
    // Shiprocket now drives shipped/delivered/cancelled automatically, so the
    // same status can be reached from here AND from a webhook. Both paths must
    // consult the same `notifiedStatuses` ledger, otherwise marking an order
    // Shipped by hand emails the customer, and the courier's own "IN TRANSIT"
    // event a few hours later emails them the exact same thing again.
    // `pending`/`processing` have no webhook counterpart, so they are left to
    // notify on every change as before.
    const statusChanged = !!nextStatus && nextStatus !== previousStatus;
    const dedupedStatuses = ['shipped', 'delivered', 'cancelled'];
    if (!Array.isArray(order.notifiedStatuses)) order.notifiedStatuses = [];

    let shouldSendEmail = statusChanged;
    if (statusChanged && dedupedStatuses.includes(nextStatus)) {
      const alreadyNotified =
        order.notifiedStatuses.includes(nextStatus) ||
        (nextStatus === 'shipped' && order.trackingEmailSent); // legacy flag
      shouldSendEmail = !alreadyNotified;
      // Recorded before the save below, so the ledger persists atomically with
      // the status change and a concurrent webhook can't slip a duplicate in.
      if (shouldSendEmail) {
        order.notifiedStatuses.push(nextStatus);
        if (nextStatus === 'shipped') order.trackingEmailSent = true;
      }
    }

    await order.save();

    // If transitioning to 'cancelled' from a non-cancelled state, restore stock.
    if (nextStatus === 'cancelled' && previousStatus !== 'cancelled') {
      await restoreStockForOrder(order);
    }

    // Send email if status changed and the customer hasn't already been told.
    if (shouldSendEmail) {
      sendOrderEmail(order, nextStatus);
    }

    // ERP push (fire-and-forget, opt-in)
    erp.sendOrderEvent('order.updated', order);

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
    // Cost of goods from per-item cost snapshots. Orders created before
    // costPrice existed (or products with no cost configured) contribute 0,
    // so grossProfit overstates until costs are filled in.
    const totalCostAgg = await Order.aggregate([
      { $match: { isPaid: true } },
      { $unwind: '$items' },
      {
        $group: {
          _id: null,
          total: { $sum: { $multiply: [{ $ifNull: ['$items.costPrice', 0] }, '$items.quantity'] } },
        },
      },
    ]);
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const deliveredOrders = await Order.countDocuments({ status: 'delivered' });

    const revenue = totalRevenue[0]?.total || 0;
    const totalCost = totalCostAgg[0]?.total || 0;

    res.json({
      totalOrders,
      totalRevenue: revenue,
      totalCost,
      grossProfit: revenue - totalCost,
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

    // ERP push (fire-and-forget, opt-in)
    erp.sendOrderEvent('order.updated', order);

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

    // Same generic message for "no such order" and "contact mismatch" below, so
    // the endpoint doesn't confirm which order numbers exist (enumeration guard).
    const genericNotFound = 'No order matches that Order ID and email/phone. Please check both and try again.';

    const order = await Order.findOne({ orderNumber: cleanOrderId }).populate('items.product', 'slug name image price');

    if (!order) {
      return res.status(404).json({ message: genericNotFound });
    }

    let isValidContact = false;

    // Phone comparisons normalise BOTH sides to the last 10 digits, so a
    // customer who saved "+91 98765 43210" (or "098765 43210") at checkout still
    // matches when they type "9876543210" here. Mirrors the phone normalisation
    // in utils/shiprocket.js — without it, format drift between storage and this
    // lookup locked valid customers out of tracking their own order.
    const normalizePhone = (val) => {
      const digits = (val || '').toString().replace(/\D/g, '');
      return digits.length > 10 ? digits.slice(-10) : digits;
    };
    const contactPhone = normalizePhone(contact);
    // Only treat the input as a phone when it resolves to a full 10-digit
    // number, so an email that happens to contain digits can't match a phone.
    const phoneMatches = (stored) => contactPhone.length === 10 && normalizePhone(stored) === contactPhone;

    // Check Guest Email
    if (order.guestEmail && order.guestEmail.toLowerCase() === cleanContact) {
      isValidContact = true;
    }

    // Check Guest Phone
    if (phoneMatches(order.guestPhone)) {
      isValidContact = true;
    }

    // Check Shipping Address Phone
    if (order.shippingAddress && phoneMatches(order.shippingAddress.phone)) {
      isValidContact = true;
    }

    // Check Billing Address Phone
    if (order.billingAddress && phoneMatches(order.billingAddress.phone)) {
      isValidContact = true;
    }

    // Check Registered User Email/Phone if linked
    if (!isValidContact && order.user) {
      const User = require('../models/User');
      const user = await User.findById(order.user);
      if (user) {
        if (user.email && user.email.toLowerCase() === cleanContact) isValidContact = true;
        if (phoneMatches(user.phone)) isValidContact = true;
      }
    }

    if (!isValidContact) {
      return res.status(404).json({ message: genericNotFound });
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
// Public endpoint keyed on AWB alone, so the raw Shiprocket payload must never
// be passed through: it can carry consignee name/address and other PII. Only
// the courier-movement fields the tracking page renders are returned.
exports.getShipmentTracking = async (req, res, next) => {
  try {
    const { awb } = req.params;
    if (!awb) return res.status(400).json({ message: 'AWB code is required' });

    const trackingData = await shiprocket.getTracking(awb);

    const td = trackingData?.tracking_data || {};
    const pickActivity = (a) => ({
      activity: a?.activity || a?.status || '',
      date:     a?.date || '',
      location: a?.location || '',
    });
    const track = td.shipment_track?.[0] || {};

    res.json({
      tracking_data: {
        track_url: td.track_url || '',
        shipment_track: [{
          current_status: track.current_status || '',
          last_location:  track.last_location || '',
          activities: Array.isArray(track.activities) ? track.activities.map(pickActivity) : undefined,
        }],
        shipment_track_activities: Array.isArray(td.shipment_track_activities)
          ? td.shipment_track_activities.map(pickActivity)
          : undefined,
      },
    });
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

// POST /api/orders/:id/sync-shiprocket (admin / manager)
exports.syncShiprocketOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    console.log(`[Shiprocket] Manual sync initiated by admin for order: ${order.orderNumber}`);

    try {
      const shipData = await shiprocket.createShipment(order);

      if (shipData && (shipData.shipment_id || shipData.order_id)) {
        order.shipmentId = shipData.shipment_id ? String(shipData.shipment_id) : '';
        order.shiprocketOrderId = shipData.order_id ? String(shipData.order_id) : '';
        order.awbCode = shipData.awb_code || '';
        order.awb = shipData.awb_code ? String(shipData.awb_code) : '';
        order.courierName = shipData.courier_name || '';
        order.shiprocketSyncStatus = 'synced';
        order.shiprocketError = '';
        await order.save();

        console.log(`✅ [Shiprocket] Manual sync SUCCESS for order ${order.orderNumber}`);
        return res.json({
          message: 'Order synced with Shiprocket successfully',
          success: true,
          order,
        });
      } else {
        const errorMsg = `Unexpected response structure from Shiprocket: ${JSON.stringify(shipData)}`;
        order.shiprocketSyncStatus = 'failed';
        order.shiprocketError = errorMsg;
        await order.save();
        return res.status(400).json({ message: errorMsg, success: false });
      }
    } catch (shipErr) {
      console.error(`❌ [Shiprocket] Manual sync FAILED for ${order.orderNumber}:`, shipErr.message);
      order.shiprocketSyncStatus = 'failed';
      order.shiprocketError = shipErr.message || 'Shiprocket API call failed';
      await order.save();
      return res.status(400).json({
        message: shipErr.message || 'Failed to sync with Shiprocket',
        success: false,
        shiprocketError: order.shiprocketError
      });
    }
  } catch (error) {
    next(error);
  }
};

