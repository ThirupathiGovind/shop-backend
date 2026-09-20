import express from 'express'
const router = express.Router()
import {
  authUser,
  registerUser,
  getUserProfile,
  updateUserProfile,
  getUsers,
  deleteUser,
  getUserById,
  updateUser,
} from '../controllers/userController.js'
import { protect, admin } from '../middleware/authMiddleware.js'
import {
  validateRegister,
  validateLogin,
  validateProfileUpdate,
  validateIdParam,
} from '../middleware/validationMiddleware.js'

router.route('/').post(validateRegister, registerUser).get(protect, admin, getUsers)
router.post('/login', validateLogin, authUser)
router
  .route('/profile')
  .get(protect, getUserProfile)
  .put(protect, validateProfileUpdate, updateUserProfile)
router
  .route('/:id')
  .delete(protect, admin, validateIdParam, deleteUser)
  .get(protect, admin, validateIdParam, getUserById)
  .put(protect, admin, validateIdParam, updateUser)

export default router
