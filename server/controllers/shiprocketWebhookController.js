/**
 * Shiprocket Tracking Webhook Controller
 *
 * ⚠️  AUTH IS ENFORCED UPSTREAM — DO NOT MOUNT THIS HANDLER DIRECTLY.
 *     Requests reaching `handleTrackingUpdate` have already been authenticated
 *     by the `validateApiKey` middleware in `routes/shiprocketWebhook.js`
 *     (constant-time x-api-key compare against SHIPROCKET_WEBHOOK_SECRET).
 *     If you wire this controller into a new route, you MUST apply the same
 *     middleware — otherwise the order-state-mutation endpoints below are
 *     publicly writable.
 *
 * Handles incoming tracking status updates from Shiprocket's webhook system.
 * - Maps Shiprocket statuses to internal order statuses
 * - Prevents duplicate tracking entries
 * - Persists full tracking timeline in DB
 * - Restores stock on RTO / cancellation
 * - Sends email notifications on status transitions
 */

const Order = require('../models/Order');
const sendEmail = require('../utils/sendEmail');
const { orderShipped, orderDelivered, orderCancelled } = require('../utils/orderEmailTemplates');
const { restoreStockForOrder } = require('./orderController');

// ─── Shiprocket status string → internal status map ───
// Normalised to UPPER CASE for matching. Covers both underscore and
// space-separated variants that Shiprocket sends across webhook types.
const STATUS_STRING_MAP = {
  // → processing
  'NEW':               'processing',
  'PICKUP GENERATED':  'processing',
  'PICKUP_GENERATED':  'processing',
  'READY TO SHIP':     'processing',
  'PICKED UP':         'processing',
  'PICKED_UP':         'processing',

  // → shipped
  'IN TRANSIT':        'shipped',
  'IN_TRANSIT':        'shipped',
  'SHIPPED':           'shipped',
  'DISPATCHED':        'shipped',
  'OUT FOR DELIVERY':  'shipped',
  'OUT_FOR_DELIVERY':  'shipped',

  // → delivered
  'DELIVERED':         'delivered',

  // → cancelled
  'RTO INITIATED':     'cancelled',
  'RTO_INITIATED':     'cancelled',
  'RTO DELIVERED':     'cancelled',
  'RTO_DELIVERED':     'cancelled',
  'CANCELLED':         'cancelled',
  'CANCELED':          'cancelled',
  'RTO':               'cancelled',
};

// ─── Shiprocket numeric status ID → internal status map ───
const STATUS_ID_MAP = {
  1:  'processing',  // AWB Assigned
  2:  'processing',  // Ready to Ship
  3:  'processing',  // Picked Up
  6:  'shipped',     // Shipped
  7:  'delivered',   // Delivered
  8:  'cancelled',   // Cancelled
  9:  'cancelled',   // RTO Initiated
  10: 'cancelled',   // RTO Delivered
  17: 'shipped',     // Out For Delivery
  18: 'shipped',     // In Transit
  19: 'shipped',     // Out For Delivery
};

// ─── Human-readable messages for each raw status ───
const STATUS_MESSAGE_MAP = {
  'NEW':               'Order created on Shiprocket',
  'PICKUP GENERATED':  'Pickup has been generated',
  'PICKUP_GENERATED':  'Pickup has been generated',
  'READY TO SHIP':     'Order is ready to ship',
  'PICKED UP':         'Shipment picked up by courier',
  'PICKED_UP':         'Shipment picked up by courier',
  'IN TRANSIT':        'Shipment in transit',
  'IN_TRANSIT':        'Shipment in transit',
  'SHIPPED':           'Shipment dispatched',
  'DISPATCHED':        'Shipment dispatched',
  'OUT FOR DELIVERY':  'Shipment out for delivery',
  'OUT_FOR_DELIVERY':  'Shipment out for delivery',
  'DELIVERED':         'Shipment delivered successfully',
  'RTO INITIATED':     'Return to origin initiated',
  'RTO_INITIATED':     'Return to origin initiated',
  'RTO DELIVERED':     'Return to origin completed',
  'RTO_DELIVERED':     'Return to origin completed',
  'CANCELLED':         'Shipment cancelled',
  'CANCELED':          'Shipment cancelled',
  'RTO':               'Return to origin',
};

// ─── Helper: Get customer email from order ───
const getCustomerEmail = async (order) => {
  if (order.guestEmail) return order.guestEmail;
  if (order.user) {
    const User = require('../models/User');
    const user = await User.findById(order.user);
    return user?.email || null;
  }
  return null;
};

// ─── Helper: Get customer name from order ───
const getCustomerName = (order) => {
  return order.shippingAddress?.fullName || 'Customer';
};

// ─── Helper: Send notification email (fire-and-forget) ───
const sendStatusEmail = async (order, newStatus) => {
  try {
    const email = await getCustomerEmail(order);
    if (!email) {
      console.warn(`⚠️ [Shiprocket Webhook] No customer email for order ${order.orderNumber}, skipping email.`);
      return;
    }

    const customerName = getCustomerName(order);
    // Populate product slugs for email links
    const populatedOrder = await Order.findById(order._id).populate('items.product', 'slug');

    if (newStatus === 'shipped') {
      await sendEmail({
        email,
        subject: `Your Order Has Been Shipped 🚚 - ${order.orderNumber}`,
        html: orderShipped(populatedOrder, customerName),
      });
      console.log(`✅ [Shiprocket Webhook] Shipped email sent to ${email} for order ${order.orderNumber}`);
    } else if (newStatus === 'delivered') {
      await sendEmail({
        email,
        subject: `Order Delivered ✅ - ${order.orderNumber}`,
        html: orderDelivered(populatedOrder, customerName),
      });
      console.log(`✅ [Shiprocket Webhook] Delivered email sent to ${email} for order ${order.orderNumber}`);
    } else if (newStatus === 'cancelled') {
      await sendEmail({
        email,
        subject: `Order Cancelled - ${order.orderNumber}`,
        html: orderCancelled(populatedOrder, customerName),
      });
      console.log(`✅ [Shiprocket Webhook] Cancellation email sent to ${email} for order ${order.orderNumber}`);
    }
  } catch (err) {
    console.error(`❌ [Shiprocket Webhook] Email failed for order ${order.orderNumber}:`, err.message);
    // Don't re-throw — email failure should not break the webhook response
  }
};

// ─── Main Webhook Handler ───
exports.handleTrackingUpdate = async (req, res) => {
  try {
    const body = req.body;

    // Extract identifiers from the payload
    const awb           = body.awb ? String(body.awb) : '';
    const orderId       = body.order_id ? String(body.order_id) : '';
    const shipmentId    = body.shipment_id ? String(body.shipment_id) : '';
    const channelOrderId = body.channel_order_id ? String(body.channel_order_id) : '';
    const courierName   = body.courier_name || '';
    const location      = body.current_city || body.scans?.location || '';

    // Extract status — Shiprocket sends it as current_status or shipment_status
    const statusRaw  = body.current_status || body.shipment_status || '';
    const statusId   = body.shipment_status_id || body.current_status_id;
    const statusUpper = String(statusRaw).toUpperCase().trim();

    console.log(`📥 [Shiprocket Webhook] Received: { awb: "${awb}", order_id: "${orderId}", shipment_id: "${shipmentId}", current_status: "${statusRaw}", status_id: ${statusId || 'N/A'} }`);

    // ─── Map to internal status ───
    let mappedStatus = STATUS_STRING_MAP[statusUpper] || null;

    // Fallback to numeric ID if string mapping didn't match
    if (!mappedStatus && statusId) {
      mappedStatus = STATUS_ID_MAP[Number(statusId)] || null;
    }

    if (!mappedStatus) {
      console.log(`⚠️ [Shiprocket Webhook] Unknown/unmapped status: "${statusRaw}" (id: ${statusId || 'N/A'}) — ignoring`);
      return res.status(200).json({ success: true, ignored: true, reason: `Unmapped status: ${statusRaw}` });
    }

    console.log(`🔄 [Shiprocket Webhook] Mapped: ${statusRaw} → ${mappedStatus}`);

    // ─── Find matching order ───
    const lookupConditions = [];
    if (awb)            lookupConditions.push({ awb });
    if (awb)            lookupConditions.push({ awbCode: awb });
    if (orderId)        lookupConditions.push({ shiprocketOrderId: orderId });
    if (shipmentId)     lookupConditions.push({ shipmentId });
    if (channelOrderId) lookupConditions.push({ orderNumber: channelOrderId });

    if (lookupConditions.length === 0) {
      console.warn(`⚠️ [Shiprocket Webhook] No identifiers in payload — cannot look up order`);
      return res.status(200).json({ success: true, ignored: true, reason: 'No order identifiers' });
    }

    const order = await Order.findOne({ $or: lookupConditions });

    if (!order) {
      console.warn(`🚫 [Shiprocket Webhook] Order not found for: awb=${awb}, order_id=${orderId}, shipment_id=${shipmentId}, channel_order_id=${channelOrderId}`);
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    console.log(`📦 [Shiprocket Webhook] Order found: ${order.orderNumber} (current status: ${order.status})`);

    // ─── Duplicate detection ───
    // Check if we already have a tracking entry with the exact same raw status
    const isDuplicate = order.trackingHistory?.some(entry => entry.srStatus === statusUpper);

    if (isDuplicate && order.status === mappedStatus) {
      console.log(`🔁 [Shiprocket Webhook] Duplicate event for ${order.orderNumber}: "${statusRaw}" already recorded — skipping`);
      return res.status(200).json({ success: true, duplicate: true });
    }

    // ─── Track previous status for transition logic ───
    const previousStatus = order.status;
    const statusChanged = previousStatus !== mappedStatus;

    // ─── Update shipping metadata ───
    if (awb && !order.awb) order.awb = awb;
    if (awb && !order.awbCode) order.awbCode = awb;
    if (awb && !order.trackingNumber) order.trackingNumber = awb;
    if (courierName && !order.courierName) order.courierName = courierName;
    if (shipmentId && !order.shipmentId) order.shipmentId = shipmentId;

    // ─── Update order status ───
    if (statusChanged) {
      order.status = mappedStatus;
    }

    // ─── Set delivered timestamp ───
    if (mappedStatus === 'delivered' && !order.deliveredAt) {
      order.deliveredAt = new Date();
    }

    // ─── Push tracking history entry (if not duplicate) ───
    if (!isDuplicate) {
      const message = STATUS_MESSAGE_MAP[statusUpper] || `Status: ${statusRaw}`;
      order.trackingHistory.push({
        status:    mappedStatus,
        srStatus:  statusUpper,
        message,
        location:  location || '',
        timestamp: new Date(),
      });
    }

    // ─── Update last tracking timestamp ───
    order.lastTrackingUpdate = new Date();

    // ─── Email flags ───
    const shouldSendShippedEmail = mappedStatus === 'shipped' && !order.trackingEmailSent;
    if (shouldSendShippedEmail) {
      order.trackingEmailSent = true;
    }

    // ─── Save the order ───
    await order.save();
    console.log(`✅ [Shiprocket Webhook] Updated: ${order.orderNumber} → ${mappedStatus} (AWB: ${awb || 'N/A'}, Courier: ${courierName || 'N/A'})`);

    // ─── Post-save side effects (non-blocking) ───

    // Stock restoration on RTO / cancellation
    if (mappedStatus === 'cancelled' && previousStatus !== 'cancelled') {
      console.log(`📦 [Shiprocket Webhook] Restoring stock for cancelled order ${order.orderNumber}`);
      restoreStockForOrder(order).catch(err =>
        console.error(`❌ [Shiprocket Webhook] Stock restore failed for ${order.orderNumber}:`, err.message)
      );
    }

    // Email notifications
    if (shouldSendShippedEmail) {
      sendStatusEmail(order, 'shipped');
    } else if (mappedStatus === 'delivered' && statusChanged) {
      sendStatusEmail(order, 'delivered');
    } else if (mappedStatus === 'cancelled' && statusChanged) {
      sendStatusEmail(order, 'cancelled');
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error(`❌ [Shiprocket Webhook] Error:`, err.message, err.stack);
    return res.status(500).json({ success: false, message: 'Internal error' });
  }
};
