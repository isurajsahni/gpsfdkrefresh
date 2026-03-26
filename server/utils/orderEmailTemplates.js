/**
 * Order Email Templates
 * Beautiful HTML email templates for order status notifications
 */

const brandColor = '#0B5D3B';
const accentColor = '#F15A29';
const bgColor = '#f7f7f7';

// Shared wrapper for all emails
const emailWrapper = (content, previewText = '') => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GPSFDK</title>
  <style>
    body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: ${bgColor}; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: ${brandColor}; padding: 30px 40px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 2px; }
    .body { padding: 40px; }
    .footer { background: #f0f0f0; padding: 25px 40px; text-align: center; font-size: 12px; color: #888; }
    .btn { display: inline-block; background: ${brandColor}; color: #ffffff !important; text-decoration: none; padding: 14px 35px; border-radius: 8px; font-weight: 600; font-size: 14px; margin-top: 15px; }
    .status-badge { display: inline-block; padding: 8px 20px; border-radius: 50px; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; }
    .item-row { display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #f0f0f0; }
    .divider { height: 1px; background: #e8e8e8; margin: 25px 0; }
    @media only screen and (max-width: 600px) {
      .body { padding: 25px 20px !important; }
      .header { padding: 20px !important; }
    }
  </style>
</head>
<body>
  <div style="display:none;max-height:0;overflow:hidden;">${previewText}</div>
  <div class="container">
    <div class="header">
      <h1>GPSFDK</h1>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} GPSFDK. All rights reserved.</p>
      <p>If you have any questions, reply to this email or contact us at contact@narsevafoundation.com</p>
    </div>
  </div>
</body>
</html>
`;

// Format currency
const formatPrice = (amount) => `₹${Number(amount).toLocaleString('en-IN')}`;

// Render order items table
const renderItems = (items) => {
  if (!items || items.length === 0) return '';
  
  let rows = items.map(item => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
        <div style="display: flex; align-items: center; gap: 12px;">
          ${item.image ? `<img src="${item.image}" alt="${item.name}" width="55" height="55" style="border-radius: 8px; object-fit: cover;" />` : ''}
          <div>
            <div style="font-weight: 600; color: #333; font-size: 14px;">${item.name}</div>
            ${item.variation ? `<div style="font-size: 12px; color: #888; margin-top: 2px;">
              ${[item.variation.size, item.variation.material, item.variation.frame, item.variation.color].filter(Boolean).join(' · ')}
            </div>` : ''}
            ${item.customText ? `<div style="font-size: 12px; color: ${accentColor}; margin-top: 2px;">Custom: ${item.customText}</div>` : ''}
          </div>
        </div>
      </td>
      <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; text-align: center; color: #666; font-size: 14px;">×${item.quantity}</td>
      <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; text-align: right; font-weight: 600; color: #333; font-size: 14px;">${formatPrice(item.price * item.quantity)}</td>
    </tr>
  `).join('');

  return `
    <table width="100%" cellspacing="0" cellpadding="0" style="margin: 20px 0;">
      <thead>
        <tr>
          <th style="text-align: left; padding: 8px 0; border-bottom: 2px solid #e8e8e8; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px;">Item</th>
          <th style="text-align: center; padding: 8px 0; border-bottom: 2px solid #e8e8e8; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px;">Qty</th>
          <th style="text-align: right; padding: 8px 0; border-bottom: 2px solid #e8e8e8; font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px;">Price</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
};

// Render price summary
const renderPriceSummary = (order) => `
  <table width="100%" cellspacing="0" cellpadding="0" style="margin-top: 10px;">
    <tr>
      <td style="padding: 6px 0; color: #666; font-size: 14px;">Subtotal</td>
      <td style="padding: 6px 0; text-align: right; color: #333; font-size: 14px;">${formatPrice(order.itemsPrice)}</td>
    </tr>
    <tr>
      <td style="padding: 6px 0; color: #666; font-size: 14px;">Shipping</td>
      <td style="padding: 6px 0; text-align: right; color: #333; font-size: 14px;">${order.shippingPrice > 0 ? formatPrice(order.shippingPrice) : 'Free'}</td>
    </tr>
    ${order.taxPrice > 0 ? `
    <tr>
      <td style="padding: 6px 0; color: #666; font-size: 14px;">Tax</td>
      <td style="padding: 6px 0; text-align: right; color: #333; font-size: 14px;">${formatPrice(order.taxPrice)}</td>
    </tr>` : ''}
    <tr>
      <td style="padding: 12px 0; font-weight: 700; font-size: 16px; color: #333; border-top: 2px solid ${brandColor};">Total</td>
      <td style="padding: 12px 0; text-align: right; font-weight: 700; font-size: 16px; color: ${brandColor}; border-top: 2px solid ${brandColor};">${formatPrice(order.totalPrice)}</td>
    </tr>
  </table>
`;

// Render shipping address
const renderAddress = (address) => {
  if (!address) return '';
  return `
    <div style="background: #fafafa; border-radius: 10px; padding: 18px; margin-top: 15px;">
      <div style="font-weight: 600; color: #333; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Shipping Address</div>
      <div style="color: #555; font-size: 14px; line-height: 1.6;">
        ${address.fullName || ''}<br>
        ${address.addressLine1 || ''}${address.addressLine2 ? ', ' + address.addressLine2 : ''}<br>
        ${address.city || ''}${address.state ? ', ' + address.state : ''} ${address.pincode || ''}<br>
        ${address.country || 'India'}
        ${address.phone ? `<br>📞 ${address.phone}` : ''}
      </div>
    </div>
  `;
};

// ========================
// EMAIL TEMPLATES
// ========================

// 1. ORDER PLACED
const orderPlaced = (order, customerName) => {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="font-size: 50px; margin-bottom: 10px;">🎉</div>
      <h2 style="color: #333; margin: 0; font-size: 24px;">Thank You for Your Order!</h2>
      <p style="color: #666; margin-top: 8px; font-size: 15px;">Hi ${customerName}, your order has been placed successfully.</p>
    </div>

    <div style="background: #f0faf4; border-left: 4px solid ${brandColor}; border-radius: 8px; padding: 18px; margin-bottom: 25px;">
      <div style="font-size: 13px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Order Number</div>
      <div style="font-size: 20px; font-weight: 700; color: ${brandColor}; margin-top: 4px;">${order.orderNumber}</div>
      <div style="font-size: 12px; color: #888; margin-top: 4px;">Payment: ${order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod.toUpperCase()}</div>
    </div>

    <h3 style="color: #333; font-size: 16px; margin-bottom: 5px;">Order Summary</h3>
    ${renderItems(order.items)}
    ${renderPriceSummary(order)}
    ${renderAddress(order.shippingAddress)}

    <div style="text-align: center; margin-top: 30px;">
      <p style="color: #666; font-size: 14px;">We'll notify you when your order is shipped.</p>
    </div>
  `;
  return emailWrapper(content, `Order ${order.orderNumber} confirmed! Thank you for shopping with GPSFDK.`);
};

// 2. ORDER PROCESSING
const orderProcessing = (order, customerName) => {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="font-size: 50px; margin-bottom: 10px;">⚙️</div>
      <h2 style="color: #333; margin: 0; font-size: 24px;">Your Order is Being Prepared!</h2>
      <p style="color: #666; margin-top: 8px; font-size: 15px;">Hi ${customerName}, great news! We're now preparing your order.</p>
    </div>

    <div style="background: #fff8f0; border-left: 4px solid ${accentColor}; border-radius: 8px; padding: 18px; margin-bottom: 25px;">
      <div style="font-size: 13px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Order Number</div>
      <div style="font-size: 20px; font-weight: 700; color: ${accentColor}; margin-top: 4px;">${order.orderNumber}</div>
      <div style="margin-top: 10px;">
        <span class="status-badge" style="background: #fff3e0; color: #e65100;">Processing</span>
      </div>
    </div>

    <h3 style="color: #333; font-size: 16px; margin-bottom: 5px;">What's Next?</h3>
    <p style="color: #666; font-size: 14px; line-height: 1.6;">Your items are being carefully prepared and will be handed over to our shipping partner soon. You'll receive another email once your order has been shipped with tracking details.</p>

    <div class="divider"></div>
    <h3 style="color: #333; font-size: 16px; margin-bottom: 5px;">Items in Your Order</h3>
    ${renderItems(order.items)}
  `;
  return emailWrapper(content, `Your order ${order.orderNumber} is being prepared!`);
};

// 3. ORDER SHIPPED / DISPATCHED
const orderShipped = (order, customerName) => {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="font-size: 50px; margin-bottom: 10px;">🚚</div>
      <h2 style="color: #333; margin: 0; font-size: 24px;">Your Order Has Been Shipped!</h2>
      <p style="color: #666; margin-top: 8px; font-size: 15px;">Hi ${customerName}, your order is on its way to you!</p>
    </div>

    <div style="background: #e8f5e9; border-left: 4px solid ${brandColor}; border-radius: 8px; padding: 18px; margin-bottom: 25px;">
      <div style="font-size: 13px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Order Number</div>
      <div style="font-size: 20px; font-weight: 700; color: ${brandColor}; margin-top: 4px;">${order.orderNumber}</div>
      ${order.trackingNumber ? `
        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #c8e6c9;">
          <div style="font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Tracking Number</div>
          <div style="font-size: 16px; font-weight: 700; color: #333; margin-top: 4px;">${order.trackingNumber}</div>
        </div>
      ` : ''}
      <div style="margin-top: 10px;">
        <span class="status-badge" style="background: #e8f5e9; color: ${brandColor};">Shipped</span>
      </div>
    </div>

    ${renderAddress(order.shippingAddress)}

    <div class="divider"></div>
    <h3 style="color: #333; font-size: 16px; margin-bottom: 5px;">Items Shipped</h3>
    ${renderItems(order.items)}

    <div style="text-align: center; margin-top: 25px;">
      <p style="color: #666; font-size: 14px;">Estimated delivery: 5-7 business days</p>
    </div>
  `;
  return emailWrapper(content, `Your order ${order.orderNumber} has been shipped!`);
};

// 4. ORDER DELIVERED
const orderDelivered = (order, customerName) => {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="font-size: 50px; margin-bottom: 10px;">✅</div>
      <h2 style="color: #333; margin: 0; font-size: 24px;">Your Order Has Been Delivered!</h2>
      <p style="color: #666; margin-top: 8px; font-size: 15px;">Hi ${customerName}, your order has been successfully delivered.</p>
    </div>

    <div style="background: #e8f5e9; border-left: 4px solid ${brandColor}; border-radius: 8px; padding: 18px; margin-bottom: 25px;">
      <div style="font-size: 13px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Order Number</div>
      <div style="font-size: 20px; font-weight: 700; color: ${brandColor}; margin-top: 4px;">${order.orderNumber}</div>
      <div style="margin-top: 10px;">
        <span class="status-badge" style="background: #c8e6c9; color: #1b5e20;">Delivered</span>
      </div>
    </div>

    <h3 style="color: #333; font-size: 16px; margin-bottom: 5px;">Order Summary</h3>
    ${renderItems(order.items)}
    ${renderPriceSummary(order)}

    <div style="text-align: center; margin-top: 30px; background: #fafafa; border-radius: 12px; padding: 25px;">
      <p style="color: #333; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">Enjoying your purchase? 💚</p>
      <p style="color: #666; font-size: 14px; margin: 0;">We'd love to hear from you! Share your experience with us.</p>
    </div>
  `;
  return emailWrapper(content, `Your order ${order.orderNumber} has been delivered!`);
};

// 5. ORDER CANCELLED
const orderCancelled = (order, customerName) => {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="font-size: 50px; margin-bottom: 10px;">❌</div>
      <h2 style="color: #333; margin: 0; font-size: 24px;">Order Cancelled</h2>
      <p style="color: #666; margin-top: 8px; font-size: 15px;">Hi ${customerName}, your order has been cancelled.</p>
    </div>

    <div style="background: #fbe9e7; border-left: 4px solid #d32f2f; border-radius: 8px; padding: 18px; margin-bottom: 25px;">
      <div style="font-size: 13px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Order Number</div>
      <div style="font-size: 20px; font-weight: 700; color: #d32f2f; margin-top: 4px;">${order.orderNumber}</div>
      <div style="margin-top: 10px;">
        <span class="status-badge" style="background: #ffcdd2; color: #b71c1c;">Cancelled</span>
      </div>
    </div>

    <h3 style="color: #333; font-size: 16px; margin-bottom: 5px;">Cancelled Items</h3>
    ${renderItems(order.items)}

    ${order.isPaid ? `
      <div style="background: #fff8e1; border-radius: 10px; padding: 18px; margin-top: 20px;">
        <p style="color: #f57f17; font-weight: 600; margin: 0 0 5px 0;">💰 Refund Information</p>
        <p style="color: #666; font-size: 14px; margin: 0;">If you've already paid, your refund of <strong>${formatPrice(order.totalPrice)}</strong> will be processed within 5-7 business days.</p>
      </div>
    ` : ''}

    <div style="text-align: center; margin-top: 30px;">
      <p style="color: #666; font-size: 14px;">If you didn't request this cancellation or have questions, please contact us.</p>
    </div>
  `;
  return emailWrapper(content, `Your order ${order.orderNumber} has been cancelled.`);
};

module.exports = {
  orderPlaced,
  orderProcessing,
  orderShipped,
  orderDelivered,
  orderCancelled,
};
