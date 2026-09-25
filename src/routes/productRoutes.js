import express from 'express';
import {
  getProducts,
  getProductById,
  deleteProduct,
  createProduct,
  updateProduct,
  createProductReview,
  getTopProducts,
} from '../controllers/productController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
  validateProduct,
  validateReview,
  validateIdParam,
} from '../middleware/validationMiddleware.js';

const router = express.Router();

router.route('/').get(getProducts).post(protect, admin, validateProduct, createProduct);
router.route('/:id/reviews').post(protect, validateIdParam, validateReview, createProductReview);
router.get('/top', getTopProducts);
router
  .route('/:id')
  .get(validateIdParam, getProductById)
  .delete(protect, admin, validateIdParam, deleteProduct)
  .put(protect, admin, validateIdParam, validateProduct, updateProduct);

export default router;
