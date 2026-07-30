// ─── ERP integration: read-only order feed ───
// Backfill + reconciliation source for the ERP's pull job. Guarded by a service
// API key (middleware/serviceKey), NOT human JWT — the ERP is a service, not an
// admin user. Returns the SAME shape as the real-time webhook push
// (utils/serializeOrder) so the ERP keeps a single mapper.
//
// Read-only: this router never writes to or mutates the orders collection.
const router = require('express').Router();
const Order = require('../models/Order');
const serializeOrder = require('../utils/serializeOrder');
const serviceKey = require('../middleware/serviceKey');

// GET /api/integrations/orders?since=<ISO>&page=<n>&limit=<n>
// Incremental sync: pass `since` = the newest updatedAt the ERP already has.
// Sorted by updatedAt ascending so the ERP can page forward deterministically.
router.get('/orders', serviceKey, async (req, res, next) => {
  try {
    // Exclude abandoned payment_pending orders — they never completed checkout.
    const filter = { status: { $ne: 'payment_pending' } };

    if (req.query.since) {
      const since = new Date(req.query.since);
      if (!Number.isNaN(since.getTime())) filter.updatedAt = { $gte: since };
    }

    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 100));
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);

    const [total, docs] = await Promise.all([
      Order.countDocuments(filter),
      Order.find(filter)
        .populate('user', 'name email phone')
        .sort('updatedAt')
        .skip((page - 1) * limit)
        .limit(limit),
    ]);

    res.json({
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit) || 1,
      orders: docs.map(serializeOrder),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
