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
const { orderShipped, orderDelivered, orderCancelled, awbAssigned } = require('../utils/orderEmailTemplates');
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
  19: 'shipped',     // ⚠️ UNVERIFIED — several Shiprocket references list id 19 as
                     // "Out For Pickup" (a pre-shipment state that should map to
                     // 'processing', not 'shipped'). Left as-is pending confirmation
                     // from real webhook logs; the string map handles the common
                     // path, so this only bites if a bare numeric 19 ever arrives.
};

// ─── Internal status lifecycle ordering ───
// Webhook events are NOT guaranteed to arrive in order and Shiprocket retries
// deliveries, so a stale event (e.g. a re-delivered "IN TRANSIT" that lands
// after "DELIVERED") must never move an order backward. Higher rank = later in
// the lifecycle. `cancelled` is handled separately (terminal, and reachable
// from any live state), so it is intentionally not ranked here.
const STATUS_RANK = {
  payment_pending: 0,
  pending:         1,
  processing:      2,
  shipped:         3,
  delivered:       4,
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

// ─── Helper: Mask email for logs (PII/log hygiene — order number is the
// correlation key; full addresses don't belong in application logs) ───
const maskEmail = (email) => {
  if (typeof email !== 'string' || !email.includes('@')) return '***';
  const [local, domain] = email.split('@');
  return `${local.slice(0, 1)}***@${domain}`;
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
      console.log(`✅ [Shiprocket Webhook] Shipped email sent to ${maskEmail(email)} for order ${order.orderNumber}`);
    } else if (newStatus === 'delivered') {
      await sendEmail({
        email,
        subject: `Order Delivered ✅ - ${order.orderNumber}`,
        html: orderDelivered(populatedOrder, customerName),
      });
      console.log(`✅ [Shiprocket Webhook] Delivered email sent to ${maskEmail(email)} for order ${order.orderNumber}`);
    } else if (newStatus === 'cancelled') {
      await sendEmail({
        email,
        subject: `Order Cancelled - ${order.orderNumber}`,
        html: orderCancelled(populatedOrder, customerName),
      });
      console.log(`✅ [Shiprocket Webhook] Cancellation email sent to ${maskEmail(email)} for order ${order.orderNumber}`);
    }
  } catch (err) {
    console.error(`❌ [Shiprocket Webhook] Email failed for order ${order.orderNumber}:`, err.message);
    // Don't re-throw — email failure should not break the webhook response
  }
};

// ─── Helper: Send AWB-assigned email (fire-and-forget) ───
const sendAwbEmail = async (order) => {
  try {
    const email = await getCustomerEmail(order);
    if (!email) {
      console.warn(`⚠️ [Shiprocket Webhook] No customer email for order ${order.orderNumber}, skipping AWB email.`);
      return;
    }
    const populatedOrder = await Order.findById(order._id).populate('items.product', 'slug');
    await sendEmail({
      email,
      subject: `Tracking Number Assigned 📦 - ${order.orderNumber}`,
      html: awbAssigned(populatedOrder, getCustomerName(order)),
    });
    console.log(`✅ [Shiprocket Webhook] AWB-assigned email sent to ${maskEmail(email)} for order ${order.orderNumber}`);
  } catch (err) {
    console.error(`❌ [Shiprocket Webhook] AWB email failed for order ${order.orderNumber}:`, err.message);
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
    // Shiprocket sends `scans` as an ARRAY of scan objects, so reading
    // `body.scans.location` was always undefined. Prefer current_city, then the
    // most recent scan's location (last element), falling back to the first.
    const scans = Array.isArray(body.scans) ? body.scans : [];
    const scanLocation = scans.length
      ? (scans[scans.length - 1]?.location || scans[0]?.location || '')
      : '';
    const location      = body.current_city || scanLocation || '';

    // Extract status — Shiprocket sends it as current_status or shipment_status
    const statusRaw  = body.current_status || body.shipment_status || '';
    const statusId   = body.shipment_status_id || body.current_status_id;
    const statusUpper = String(statusRaw).toUpperCase().trim();

    console.log(`📥 [Shiprocket Webhook] Received: { awb: "${awb}", order_id: "${orderId}", shipment_id: "${shipmentId}", current_status: "${statusRaw}", status_id: ${statusId || 'N/A'} }`);

    // ─── Map to internal status ───
    let mappedStatus = STATUS_STRING_MAP[statusUpper] || null;

    // Fallback to numeric ID if string mapping didn't match. The string map is
    // authoritative and covers Shiprocket's live payloads; this numeric table is
    // best-effort and NOT verified against Shiprocket's authenticated API docs,
    // so log loudly when it's actually exercised — real webhook traffic is the
    // reliable way to confirm each id, and a wrong id here would otherwise
    // silently drive a status change.
    if (!mappedStatus && statusId) {
      mappedStatus = STATUS_ID_MAP[Number(statusId)] || null;
      console.warn(`🔢 [Shiprocket Webhook] String status "${statusRaw || 'N/A'}" unmapped — using numeric fallback id=${statusId} → ${mappedStatus || 'still-unmapped'}. Verify this id against Shiprocket if unexpected.`);
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
      // Acknowledge (200), don't 404: a shipment we don't recognise will never
      // become findable, so a non-2xx just makes Shiprocket retry it forever (F6).
      return res.status(200).json({ success: true, ignored: true, reason: 'Order not found' });
    }

    console.log(`📦 [Shiprocket Webhook] Order found: ${order.orderNumber} (current status: ${order.status})`);

    // Belt-and-braces: Mongoose hydrates missing array paths as [], but a
    // throw here would 500 → Shiprocket retry storm, so guard explicitly.
    if (!Array.isArray(order.trackingHistory)) order.trackingHistory = [];
    if (!Array.isArray(order.notifiedStatuses)) order.notifiedStatuses = [];

    // ─── Duplicate detection ───
    // A single raw status (esp. "IN TRANSIT") legitimately fires many times as
    // the package moves through hubs, each with a different location. Keying the
    // dedup on raw status ALONE collapsed the whole journey into one timeline
    // entry, so match on (srStatus + location): only a repeat of the same status
    // at the same location is a true duplicate; a new-location scan is recorded.
    const eventLocation = (location || '').trim();
    const isDuplicate = order.trackingHistory.some(
      entry => entry.srStatus === statusUpper && (entry.location || '').trim() === eventLocation
    );

    if (isDuplicate && order.status === mappedStatus) {
      console.log(`🔁 [Shiprocket Webhook] Duplicate event for ${order.orderNumber}: "${statusRaw}" @ "${eventLocation || 'N/A'}" already recorded — skipping`);
      return res.status(200).json({ success: true, duplicate: true });
    }

    // ─── Track previous status for transition logic ───
    const previousStatus = order.status;

    // ─── Decide whether this event may CHANGE order.status (forward-only) ───
    // Guards against out-of-order / re-delivered webhooks regressing an order:
    //  • `cancelled` is terminal — a stale live-shipment event must not un-cancel
    //  • a cancellation / RTO is authoritative and may arrive from any live state
    //  • otherwise only move forward in the lifecycle, never backward
    // (History is still appended below regardless, so the timeline stays complete.)
    let willAdvance;
    if (previousStatus === mappedStatus) {
      willAdvance = false;
    } else if (previousStatus === 'cancelled') {
      willAdvance = false;
    } else if (mappedStatus === 'cancelled') {
      willAdvance = true;
    } else {
      willAdvance = (STATUS_RANK[mappedStatus] ?? -1) > (STATUS_RANK[previousStatus] ?? -1);
    }
    if (!willAdvance && previousStatus !== mappedStatus) {
      console.log(`↩️ [Shiprocket Webhook] Not advancing ${order.orderNumber}: "${mappedStatus}" does not supersede current "${previousStatus}" (out-of-order/stale event) — recording history only`);
    }

    // ─── Update shipping metadata ───
    // First time we see an AWB for this order? (checked before assignment below)
    const isFirstAwb = !!awb && !order.awb && !order.awbCode && !order.trackingNumber;
    if (awb && !order.awb) order.awb = awb;
    if (awb && !order.awbCode) order.awbCode = awb;
    if (awb && !order.trackingNumber) order.trackingNumber = awb;
    if (courierName && !order.courierName) order.courierName = courierName;
    if (shipmentId && !order.shipmentId) order.shipmentId = shipmentId;

    // ─── Update order status (forward-only, per willAdvance above) ───
    if (willAdvance) {
      order.status = mappedStatus;
    }

    // ─── Set delivered timestamp ───
    // Keyed on the order's ACTUAL status after the guard above, so a stale
    // "DELIVERED" that didn't advance the order never back-dates deliveredAt.
    if (order.status === 'delivered' && !order.deliveredAt) {
      order.deliveredAt = new Date();
    }

    // ─── Push tracking history entry (if not duplicate) ───
    if (!isDuplicate) {
      const message = STATUS_MESSAGE_MAP[statusUpper] || `Status: ${statusRaw}`;
      order.trackingHistory.push({
        status:    mappedStatus,
        srStatus:  statusUpper,
        message,
        location:  eventLocation,
        timestamp: new Date(),
      });
    }

    // ─── Update last tracking timestamp ───
    order.lastTrackingUpdate = new Date();

    // ─── Email idempotency ───
    // Send each status email at most once per order — guards against webhook
    // redelivery and status oscillation, e.g. delivered → RTO → delivered (F7).
    const emailableStatuses = ['shipped', 'delivered', 'cancelled'];
    const alreadyNotified =
      order.notifiedStatuses.includes(mappedStatus) ||
      (mappedStatus === 'shipped' && order.trackingEmailSent); // legacy flag for pre-existing orders
    // Only notify when this event actually moved the order INTO mappedStatus
    // (or the order is already there) — never on a stale backward event, so a
    // re-delivered "IN TRANSIT" after "DELIVERED" can't send a late shipped email.
    const isForwardOrCurrent = willAdvance || previousStatus === mappedStatus;
    const shouldSendEmail = emailableStatuses.includes(mappedStatus) && !alreadyNotified && isForwardOrCurrent;
    if (shouldSendEmail) {
      order.notifiedStatuses.push(mappedStatus);
      if (mappedStatus === 'shipped') order.trackingEmailSent = true; // keep legacy flag in sync
    }

    // AWB-assigned email — fires the first time Shiprocket reports a tracking
    // number (usually on "AWB Assigned"/pickup events, before "shipped").
    // Skipped when a status email goes out on this same event, since the
    // shipped/delivered/cancelled templates already carry the AWB.
    const shouldSendAwbEmail =
      isFirstAwb &&
      !shouldSendEmail &&
      !order.notifiedStatuses.includes('awb_assigned');
    if (shouldSendAwbEmail) {
      order.notifiedStatuses.push('awb_assigned');
    }

    // ─── Save the order ───
    await order.save();
    console.log(`✅ [Shiprocket Webhook] Updated: ${order.orderNumber} → ${order.status} (AWB: ${awb || 'N/A'}, Courier: ${courierName || 'N/A'})`);

    // ─── Post-save side effects (non-blocking) ───

    // Stock restoration on RTO / cancellation
    if (mappedStatus === 'cancelled' && previousStatus !== 'cancelled') {
      console.log(`📦 [Shiprocket Webhook] Restoring stock for cancelled order ${order.orderNumber}`);
      restoreStockForOrder(order).catch(err =>
        console.error(`❌ [Shiprocket Webhook] Stock restore failed for ${order.orderNumber}:`, err.message)
      );
    }

    // Email notifications — once per status, resolved above
    if (shouldSendEmail) {
      sendStatusEmail(order, mappedStatus);
    }
    if (shouldSendAwbEmail) {
      sendAwbEmail(order);
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    // A Mongoose VersionError means a concurrent webhook for the same order won
    // the save race. State has already advanced and Shiprocket re-sends
    // current_status on later events, so acknowledge (200) instead of 500 to
    // avoid a retry storm over an event that's already moot (F5).
    if (err.name === 'VersionError') {
      console.warn(`⚠️ [Shiprocket Webhook] Concurrent update (VersionError) — acknowledging`);
      return res.status(200).json({ success: true, concurrent: true });
    }
    console.error(`❌ [Shiprocket Webhook] Error:`, err.message, err.stack);
    return res.status(500).json({ success: false, message: 'Internal error' });
  }
};
