const router = require('express').Router();
const { register, login, getMe, updateProfile, getUsers, deleteUser, updateUserRole, forgotPassword, verifyOtp, resetPassword, addAddress, deleteAddress, updateAddress, sendEmailUpdateOtp, verifyEmailUpdateOtp, uploadAvatar, sendRegistrationOtp, verifyRegistrationOtp, phoneLogin } = require('../controllers/authController');
const { protect, admin } = require('../middleware/auth');
const { avatarUpload } = require('../middleware/upload');
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
router.post('/firebase-login', authLimiter, phoneLogin);

// Registration email OTP verification
router.post('/send-registration-otp', authLimiter, sendRegistrationOtp);
router.post('/verify-registration-otp', otpLimiter, verifyRegistrationOtp);

router.post('/login', authLimiter, loginValidation, login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/upload-avatar', protect, avatarUpload.single('avatar'), uploadAvatar);
router.get('/users', protect, admin, getUsers);
router.delete('/users/:id', protect, admin, deleteUser);
router.put('/users/:id/role', protect, admin, updateUserRole);

router.post('/forgot-password', authLimiter, forgotPasswordValidation, forgotPassword);
router.post('/verify-otp', otpLimiter, verifyOtpValidation, verifyOtp);
router.put('/reset-password', otpLimiter, resetPasswordValidation, resetPassword);

router.post('/addresses', protect, addAddress);
router.put('/addresses/:id', protect, updateAddress);
router.delete('/addresses/:id', protect, deleteAddress);

// Email update OTP verification
router.post('/send-email-update-otp', protect, sendEmailUpdateOtp);
router.post('/verify-email-update-otp', protect, verifyEmailUpdateOtp);

module.exports = router;

