const router = require('express').Router();
const { 
  createOrder, createGuestOrder, getOrders, getOrderById, updateOrderStatus, 
  getOrderStats, cancelOrder, deleteOrder, trackOrder, getShipmentTracking,
  getShiprocketOrderDetails
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/auth');
const { guestOrderValidation, guestOrderLimiter } = require('../middleware/validators');

router.post('/', protect, createOrder);
router.post('/guest', guestOrderLimiter, guestOrderValidation, createGuestOrder);
router.get('/', protect, getOrders);
router.get('/track', trackOrder);
router.get('/track-awb/:awb', getShipmentTracking);
router.get('/stats', protect, admin, getOrderStats);
router.get('/shiprocket/:id', protect, admin, getShiprocketOrderDetails);
router.get('/:id', protect, getOrderById);
router.put('/:id', protect, admin, updateOrderStatus);
router.put('/:id/cancel', protect, cancelOrder);
router.delete('/:id', protect, admin, deleteOrder);

module.exports = router;
