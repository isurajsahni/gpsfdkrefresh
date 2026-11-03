const router = require('express').Router();
const { register, login, getMe, updateProfile, deleteOwnAccount, getUsers, getUsersCount, deleteUser, updateUserRole, forgotPassword, verifyOtp, resetPassword, addAddress, deleteAddress, updateAddress, sendEmailUpdateOtp, verifyEmailUpdateOtp, uploadAvatar, sendRegistrationOtp, verifyRegistrationOtp, sendPasswordlessOtp, verifyPasswordlessOtp, completePasswordlessRegistration, createExhibitionSignup, getExhibitionSignups } = require('../controllers/authController');
const { protect, admin, authorizeRoles } = require('../middleware/auth');
const { avatarUpload } = require('../middleware/upload');
const {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  verifyOtpValidation,
  resetPasswordValidation,
  authLimiter,
  otpLimiter,
  exhibitionSignupLimiter,
} = require('../middleware/validators');

router.post('/register', authLimiter, registerValidation, register);

// Registration email OTP verification
router.post('/send-registration-otp', authLimiter, sendRegistrationOtp);
router.post('/verify-registration-otp', otpLimiter, verifyRegistrationOtp);

router.post('/login', authLimiter, loginValidation, login);
router.get('/me', protect, getMe);
// Self-serve account deletion (Apple 5.1.1(v)) — anonymises the account.
router.delete('/me', protect, deleteOwnAccount);
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
router.post('/passwordless/complete-registration', authLimiter, completePasswordlessRegistration);

// Staff create a customer's account at an exhibition booth, without an OTP
router.post('/exhibition-signup', protect, authorizeRoles('exhibition_staff'), exhibitionSignupLimiter, createExhibitionSignup);
router.get('/exhibition-signups', protect, admin, getExhibitionSignups);

module.exports = router;
