const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      // A JWT stays valid for its full 7-day life even if the account is deleted
      // in the meantime, in which case findById resolves to null. Without this
      // guard the request continued with req.user === null and every handler
      // that reaches for req.user._id (getMe, addAddress, createOrder, ...)
      // threw a TypeError and surfaced as a 500. The admin/marketing guards
      // already fail safe via `req.user && ...`, so this is about turning a
      // crash into the correct 401 for routes that only use `protect`.
      // NOTE: optionalAuth below deliberately does NOT do this - public routes
      // must still serve anonymous shoppers when the user is missing.
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user no longer exists' });
      }
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Admin middleware
const admin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'admin_marketing')) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

const optionalAuth = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch (error) {
      // Ignore token errors for optional auth
    }
  }
  next();
};

const marketing = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'marketing' || req.user.role === 'admin_marketing')) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as marketing user' });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    // Always allow admin and admin_marketing
    if (req.user.role === 'admin' || req.user.role === 'admin_marketing') {
      return next();
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Role (${req.user.role}) is not allowed to access this resource` });
    }
    next();
  };
};

module.exports = { protect, admin, marketing, optionalAuth, authorizeRoles };
