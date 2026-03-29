const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

// ─── Validation result handler ───
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
  }
  next();
};

// ─── Auth validations ───
const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters')
    .matches(/^[a-zA-Z\s.'-]+$/).withMessage('Name contains invalid characters'),
  body('email').trim().isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .matches(/^[6-9]\d{9}$/).withMessage('Invalid Indian phone number'),
  validate,
];

const loginValidation = [
  body('email').trim().isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  validate,
];

const forgotPasswordValidation = [
  body('email').trim().isEmail().normalizeEmail().withMessage('Valid email is required'),
  validate,
];

const verifyOtpValidation = [
  body('email').trim().isEmail().normalizeEmail(),
  body('otp').trim().notEmpty().isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  validate,
];

const resetPasswordValidation = [
  body('email').trim().isEmail().normalizeEmail(),
  body('otp').trim().notEmpty().isLength({ min: 6, max: 6 }),
  body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  validate,
];

// ─── Order validations ───
const guestOrderValidation = [
  body('guestEmail').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('shippingAddress.fullName').trim().isLength({ min: 2, max: 50 }).withMessage('Invalid full name'),
  body('shippingAddress.phone').matches(/^[6-9]\d{9}$/).withMessage('Invalid phone number'),
  body('shippingAddress.addressLine1').trim().isLength({ min: 5 }).withMessage('Address too short'),
  body('shippingAddress.city').trim().notEmpty().withMessage('City is required'),
  body('shippingAddress.state').trim().notEmpty().withMessage('State is required'),
  body('shippingAddress.pincode').matches(/^\d{6}$/).withMessage('Invalid pincode'),
  body('paymentMethod').isIn(['razorpay', 'stripe', 'cod']).withMessage('Invalid payment method'),
  validate,
];

// ─── Lead validations ───
const leadValidation = [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Invalid name'),
  body('email').trim().isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').optional().matches(/^[6-9]\d{9}$/).withMessage('Invalid phone number'),
  body('message').trim().isLength({ min: 10, max: 2000 }).withMessage('Message must be 10-2000 characters'),
  validate,
];

// ─── Rate limiters ───
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many attempts, please try again after 15 minutes.' },
});

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  message: { message: 'Too many OTP attempts. Please wait 10 minutes.' },
});

const guestOrderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many order attempts. Please try again later.' },
});

const publicEndpointLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { message: 'Too many requests. Please slow down.' },
});

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  verifyOtpValidation,
  resetPasswordValidation,
  guestOrderValidation,
  leadValidation,
  authLimiter,
  otpLimiter,
  guestOrderLimiter,
  publicEndpointLimiter,
};
