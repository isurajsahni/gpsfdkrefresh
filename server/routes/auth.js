const router = require('express').Router();
const { register, login, getMe, updateProfile, getUsers, getUsersCount, deleteUser, updateUserRole, forgotPassword, verifyOtp, resetPassword, addAddress, deleteAddress, updateAddress, sendEmailUpdateOtp, verifyEmailUpdateOtp, uploadAvatar, sendRegistrationOtp, verifyRegistrationOtp, sendPasswordlessOtp, verifyPasswordlessOtp, verifyFirebaseToken, completePasswordlessRegistration } = require('../controllers/authController');
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

// Registration email OTP verification
router.post('/send-registration-otp', authLimiter, sendRegistrationOtp);
router.post('/verify-registration-otp', otpLimiter, verifyRegistrationOtp);

router.post('/login', authLimiter, loginValidation, login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/upload-avatar', protect, avatarUpload.single('avatar'), uploadAvatar);
router.get('/users', protect, admin, getUsers);
router.get('/users/count', protect, admin, getUsersCount);
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

// Passwordless Authentication Routes
router.post('/passwordless/send-otp', authLimiter, sendPasswordlessOtp);
router.post('/passwordless/verify-otp', otpLimiter, verifyPasswordlessOtp);
router.post('/passwordless/verify-firebase', otpLimiter, verifyFirebaseToken);
router.post('/passwordless/complete-registration', authLimiter, completePasswordlessRegistration);

module.exports = router;
