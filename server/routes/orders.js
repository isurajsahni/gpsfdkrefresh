const router = require('express').Router();
const { 
  createOrder, createGuestOrder, getOrders, getOrderById, updateOrderStatus, 
  getOrderStats, cancelOrder, deleteOrder, trackOrder, getShipmentTracking,
  getShiprocketOrderDetails
} = require('../controllers/orderController');
const { protect, admin, authorizeRoles } = require('../middleware/auth');
const { guestOrderValidation, guestOrderLimiter } = require('../middleware/validators');

router.post('/', protect, createOrder);
router.post('/guest', guestOrderLimiter, guestOrderValidation, createGuestOrder);
router.get('/', protect, getOrders);
router.get('/track', trackOrder);
router.get('/track-awb/:awb', getShipmentTracking);
router.get('/stats', protect, authorizeRoles('order_manager'), getOrderStats);
router.get('/shiprocket/:id', protect, authorizeRoles('order_manager'), getShiprocketOrderDetails);
router.get('/:id', protect, getOrderById);
router.put('/:id', protect, authorizeRoles('order_manager'), updateOrderStatus);
router.put('/:id/cancel', protect, cancelOrder);
router.delete('/:id', protect, admin, deleteOrder); // Only admin can delete

module.exports = router;
