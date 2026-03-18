const router = require('express').Router();
const { createOrder, createGuestOrder, getOrders, getOrderById, updateOrderStatus, getOrderStats } = require('../controllers/orderController');
const { protect, admin } = require('../middleware/auth');

router.post('/', protect, createOrder);
router.post('/guest', createGuestOrder);
router.get('/', protect, getOrders);
router.get('/stats', protect, admin, getOrderStats);
router.get('/:id', protect, getOrderById);
router.put('/:id', protect, admin, updateOrderStatus);

module.exports = router;
