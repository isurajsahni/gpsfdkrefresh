// ─── Single source of truth for the order payload sent to the ERP ───
// Pure & synchronous: reads only fields already present on the order document,
// so it never touches the DB and never throws on a well-formed order. BOTH the
// real-time webhook push (utils/erpWebhook.js) and the pull/backfill endpoint
// (routes/integrations.js) emit this exact shape, so the ERP maintains one
// mapper. `orderNumber` (GPS-…) is the stable business key the ERP upserts on —
// never the Mongo _id.
//
// Customer email/phone/name: guest fields win, then the populated `user`
// (the pull endpoint populates it), then the shipping address. On the
// real-time push `user` may be an unpopulated ObjectId — in that case email
// falls back to guest/blank and the pull job reconciles the full record later.

module.exports = function serializeOrder(order) {
  const o = order && typeof order.toObject === 'function' ? order.toObject() : (order || {});
  const ship = o.shippingAddress || {};
  const user = o.user && typeof o.user === 'object' ? o.user : null;

  return {
    orderNumber: o.orderNumber,
    status: o.status,
    isPaid: !!o.isPaid,
    paymentMethod: o.paymentMethod,
    customer: {
      name: ship.fullName || user?.name || '',
      email: o.guestEmail || user?.email || '',
      phone: o.guestPhone || ship.phone || user?.phone || '',
    },
    items: (o.items || []).map((i) => ({
      name: i.name || '',
      variation: i.variation || {},
      quantity: i.quantity,
      price: i.price,
      costPrice: i.costPrice ?? 0,
      customText: i.customText || '',
      uploadedImageUrl: i.uploadedImageUrl || '',
    })),
    amounts: {
      itemsPrice: o.itemsPrice ?? 0,
      shippingPrice: o.shippingPrice ?? 0,
      taxPrice: o.taxPrice ?? 0,
      discountPrice: o.discountPrice ?? 0,
      totalPrice: o.totalPrice ?? 0,
      couponCode: o.couponCode ?? null,
    },
    shippingAddress: {
      fullName: ship.fullName || '',
      phone: ship.phone || '',
      addressLine1: ship.addressLine1 || '',
      addressLine2: ship.addressLine2 || '',
      city: ship.city || '',
      state: ship.state || '',
      pincode: ship.pincode || '',
      country: ship.country || 'India',
    },
    shipping: {
      awb: o.awb || o.awbCode || '',
      courierName: o.courierName || '',
      trackingUrl: o.trackingUrl || '',
      status: o.status,
    },
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
};
