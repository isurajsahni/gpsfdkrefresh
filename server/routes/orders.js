const router = require('express').Router();
const { createOrder, createGuestOrder, getOrders, getOrderById, updateOrderStatus, getOrderStats, cancelOrder, deleteOrder } = require('../controllers/orderController');
const { protect, admin } = require('../middleware/auth');

router.post('/', protect, createOrder);
router.post('/guest', createGuestOrder);
router.get('/', protect, getOrders);
router.get('/stats', protect, admin, getOrderStats);
router.get('/:id', protect, getOrderById);
router.put('/:id', protect, admin, updateOrderStatus);
router.put('/:id/cancel', protect, cancelOrder);
router.delete('/:id', protect, admin, deleteOrder);

module.exports = router;
