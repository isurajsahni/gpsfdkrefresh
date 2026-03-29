const router = require('express').Router();
const { register, login, getMe, updateProfile, getUsers, deleteUser, forgotPassword, verifyOtp, resetPassword, addAddress, deleteAddress } = require('../controllers/authController');
const { protect, admin } = require('../middleware/auth');
const {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  verifyOtpValidation,
  resetPasswordValidation,
  authLimiter,
  otpLimiter,
} = require('../middleware/validators');

router.post('/register', authLimiter, registerValidation, register);
router.post('/login', authLimiter, loginValidation, login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.get('/users', protect, admin, getUsers);
router.delete('/users/:id', protect, admin, deleteUser);

router.post('/forgot-password', authLimiter, forgotPasswordValidation, forgotPassword);
router.post('/verify-otp', otpLimiter, verifyOtpValidation, verifyOtp);
router.put('/reset-password', otpLimiter, resetPasswordValidation, resetPassword);

router.post('/addresses', protect, addAddress);
router.delete('/addresses/:id', protect, deleteAddress);

module.exports = router;
