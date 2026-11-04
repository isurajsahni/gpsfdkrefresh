const mongoose = require('mongoose');
const User = require('../models/User');

const refuse = (statusCode, message) => Object.assign(new Error(message), { statusCode });

// Admins can place an order on a customer's account from checkout. Resolves the
// `customerId` an order request names to that customer, or null when the request
// doesn't name one (the shopper is ordering for themselves). Refuses anyone but
// an admin: this is what stops a shopper putting orders on someone else's account.
const resolveOrderCustomer = async (req, customerId) => {
  if (!customerId) return null;
  if (!['admin', 'admin_marketing'].includes(req.user?.role)) {
    throw refuse(403, 'Only an admin can order for a customer.');
  }
  if (typeof customerId !== 'string' || !mongoose.isValidObjectId(customerId)) {
    throw refuse(400, 'Invalid customer.');
  }
  const customer = await User.findOne({ _id: customerId, deletedAt: null }).select('-password');
  if (!customer) throw refuse(404, 'This customer no longer exists.');
  return customer;
};

module.exports = { resolveOrderCustomer };
