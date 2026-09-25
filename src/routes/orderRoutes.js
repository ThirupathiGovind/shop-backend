import express from 'express';
import {
  addOrderItems,
  getOrderById,
  updateOrderToPaid,
  updateOrderToDelivered,
  getMyOrders,
  getOrders,
} from '../controllers/orderController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import { validateOrder, validateIdParam } from '../middleware/validationMiddleware.js';

const router = express.Router();

router.route('/').post(protect, validateOrder, addOrderItems).get(protect, admin, getOrders);
router.route('/myorders').get(protect, getMyOrders);
router.route('/:id').get(protect, validateIdParam, getOrderById);
router.route('/:id/pay').put(protect, validateIdParam, updateOrderToPaid);
router.route('/:id/deliver').put(protect, admin, validateIdParam, updateOrderToDelivered);

export default router;
