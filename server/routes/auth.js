const router = require('express').Router();
const { register, login, getMe, updateProfile, getUsers, deleteUser, forgotPassword, verifyOtp, resetPassword, addAddress, deleteAddress } = require('../controllers/authController');
const { protect, admin } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.get('/users', protect, admin, getUsers);
router.delete('/users/:id', protect, admin, deleteUser);

router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.put('/reset-password', resetPassword);

router.post('/addresses', protect, addAddress);
router.delete('/addresses/:id', protect, deleteAddress);

module.exports = router;
