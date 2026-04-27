/**
 * Shiprocket Tracking Webhook Controller
 *
 * Handles incoming tracking status updates from Shiprocket's webhook system.
 * Updates order status in DB and triggers a tracking email on first "shipped" event.
 */

const Order = require('../models/Order');
const sendEmail = require('../utils/sendEmail');
const { orderShipped, orderDelivered } = require('../utils/orderEmailTemplates');

// ─── Shiprocket status string → internal status map ───
const STATUS_STRING_MAP = {
  'delivered': 'delivered',
  'canceled': 'cancelled',
  'cancelled': 'cancelled',
  'rto': 'cancelled',
  'shipped': 'shipped',
  'in transit': 'shipped',
  'out for delivery': 'shipped',
  'picked up': 'shipped',
  'dispatched': 'shipped'
};

// ─── Shiprocket numeric status ID → internal status map ───
const STATUS_ID_MAP = {
  6: 'shipped',
  7: 'delivered',
  8: 'cancelled',
  9: 'cancelled', // RTO
  10: 'cancelled', // RTO Delivered
  17: 'shipped', // Out For Delivery
  18: 'shipped', // In Transit
};

// Map Shiprocket statuses to valid Order model enum values
const toOrderStatus = (mapped) => {
  const schemaMap = {
    pending: 'pending',
    shipped: 'shipped',
    delivered: 'delivered',
    cancelled: 'cancelled',
  };
  return schemaMap[mapped] || null;
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

// ─── Helper: Send tracking email (shipped notification) ───
const sendTrackingEmail = async (order) => {
  try {
    const email = await getCustomerEmail(order);
    if (!email) {
      console.warn(`[Shiprocket Webhook] No customer email for order ${order.orderNumber}, skipping email.`);
      return;
    }

    const customerName = getCustomerName(order);
    const awb = order.awbCode || order.trackingNumber || '';

    await sendEmail({
      email,
      subject: `Your Order Has Been Shipped 🚚 - ${order.orderNumber}`,
      html: orderShipped(order, customerName),
    });

    console.log(`✅ [Shiprocket Webhook] Tracking email sent to ${email} for order ${order.orderNumber} (AWB: ${awb})`);
  } catch (err) {
    console.error(`❌ [Shiprocket Webhook] Failed to send tracking email for order ${order.orderNumber}:`, err.message);
    // Don't re-throw — email failure should not break the webhook response
  }
};

// ─── Main Webhook Handler ───
exports.handleTrackingUpdate = async (req, res) => {
  try {
    // 1. Log incoming payload
    console.log('\n📦 [Shiprocket Webhook] Incoming payload:', JSON.stringify(req.body, null, 2));

    // 2. Extract fields
    const { awb, shipment_id, current_status, current_status_id } = req.body || {};

    // Handle Shiprocket test ping (empty body or missing required fields)
    if (!shipment_id) {
      console.log('[Shiprocket Webhook] Test ping received (no shipment_id) — acknowledging');
      return res.status(200).json({ success: true, message: 'Webhook received (test ping)' });
    }

    // 3. Map numeric status or string status
    let mappedStatus = null;
    
    // First try by ID if available
    if (current_status_id) {
      mappedStatus = STATUS_ID_MAP[Number(current_status_id)];
    }
    
    // If not mapped by ID, try by string
    if (!mappedStatus && current_status) {
      mappedStatus = STATUS_STRING_MAP[String(current_status).toLowerCase()];
    }

    if (!mappedStatus) {
      console.warn(`[Shiprocket Webhook] Unmapped status: ID=${current_status_id}, String=${current_status}. Keeping as pending/unchanged.`);
    }

    const orderStatus = mappedStatus ? toOrderStatus(mappedStatus) : null;
    console.log(`[Shiprocket Webhook] Status ID: ${current_status_id}, String: ${current_status} → Mapped: ${mappedStatus} → Order status: ${orderStatus || 'unchanged'}`);

    // 4. Find order by shipmentId
    const order = await Order.findOne({ shipmentId: String(shipment_id) }).populate('items.product', 'slug');

    if (!order) {
      console.warn(`[Shiprocket Webhook] No order found for shipment_id: ${shipment_id}`);
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // 5. Update order fields
    if (orderStatus) {
      order.status = orderStatus;
    }
    if (awb) {
      order.awbCode = awb;
    }
    if (orderStatus === 'delivered') {
      order.deliveredAt = new Date();
    }

    // 6. Tracking email on "shipped" (with duplicate protection)
    const shouldSendEmail =
      mappedStatus === 'shipped' &&
      !order.trackingEmailSent;

    if (shouldSendEmail) {
      order.trackingEmailSent = true; // Mark BEFORE saving to prevent race conditions
    }

    await order.save();

    // 7. Fire email after save (non-blocking to webhook response)
    if (shouldSendEmail) {
      // Re-fetch with populated items for email template
      const populatedOrder = await Order.findById(order._id).populate('items.product', 'slug');
      sendTrackingEmail(populatedOrder); // Intentionally not awaited — fire-and-forget
    }

    // 8. Also send delivered email if applicable
    if (orderStatus === 'delivered') {
      const email = await getCustomerEmail(order);
      if (email) {
        const customerName = getCustomerName(order);
        const populatedOrder = await Order.findById(order._id).populate('items.product', 'slug');
        sendEmail({
          email,
          subject: `Order Delivered ✅ - ${order.orderNumber}`,
          html: orderDelivered(populatedOrder, customerName),
        }).catch(err => console.error(`❌ [Shiprocket Webhook] Delivered email failed:`, err.message));
      }
    }

    console.log(`✅ [Shiprocket Webhook] Order ${order.orderNumber} updated → ${orderStatus} (AWB: ${order.awbCode})`);

    return res.status(200).json({
      success: true,
      message: 'Tracking update processed',
      orderNumber: order.orderNumber,
      status: orderStatus,
    });

  } catch (error) {
    console.error('❌ [Shiprocket Webhook] Processing error:', error.message, error.stack);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
