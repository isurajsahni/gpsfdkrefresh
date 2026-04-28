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
    console.log("Webhook Hit:", JSON.stringify(req.body, null, 2));

    const statusRaw = req.body.current_status || req.body.shipment_status;
    const status = statusRaw?.toUpperCase();

    const awb = String(req.body.awb);
    const shiprocketOrderId = req.body.order_id;

    const statusMap = {
      "NEW": "pending",
      "READY TO SHIP": "processing",
      "SHIPPED": "shipped",
      "OUT FOR DELIVERY": "shipped",
      "DELIVERED": "delivered",
      "CANCELLED": "cancelled"
    };

    const newStatus = statusMap[status];

    if (!newStatus) {
      console.log("Unknown status:", status);
      return res.status(200).json({ ignored: true });
    }

    const order = await Order.findOne({
      $or: [
        { shiprocketOrderId },
        { awb }
      ]
    });

    if (!order) {
      console.log("Order not found:", shiprocketOrderId, awb);
      return res.status(200).json({ notFound: true });
    }

    // 6. Tracking email on "shipped"
    const shouldSendEmail = newStatus === 'shipped' && !order.trackingEmailSent;
    if (shouldSendEmail) {
      order.trackingEmailSent = true;
    }

    if (newStatus === 'delivered') {
      order.deliveredAt = new Date();
    }

    if (order.status !== newStatus) {
      order.status = newStatus;
      await order.save();
      console.log("Status updated →", newStatus);

      // 7. Fire email after save
      if (shouldSendEmail) {
        const populatedOrder = await Order.findById(order._id).populate('items.product', 'slug');
        sendTrackingEmail(populatedOrder);
      }

      // 8. Send delivered email
      if (newStatus === 'delivered') {
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
    }

    res.status(200).json({ success: true });

  } catch (err) {
    console.error("Webhook Error:", err);
    res.status(200).json({ error: true });
  }
};
