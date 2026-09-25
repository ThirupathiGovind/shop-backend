import mongoose from 'mongoose';
import {
  LOGIN_PASSWORD_MIN_LENGTH,
  NAME_MIN_LENGTH,
  PASSWORD_MIN_LENGTH,
  REVIEW_COMMENT_MIN_LENGTH,
  REVIEW_RATING_MAX,
  REVIEW_RATING_MIN,
  DEFAULT_UPLOAD_SIZE_BYTES,
} from '../constants.js';

const normalizeEmail = (email = '') => String(email).trim().toLowerCase();

const isStrongPassword = (value = '') => value.length >= PASSWORD_MIN_LENGTH && /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value);

const isValidPhone = (value = '') => /^\+?[1-9]\d{7,14}$/.test(String(value).trim());

const validateIdParam = (req, res, next) => {
  const { id } = req.params;

  if (id && !mongoose.isValidObjectId(id)) {
    return res.status(400).json({ message: 'Invalid resource ID' });
  }

  return next();
};

const validateRegister = (req, res, next) => {
  const {
    name, phoneNumber, email, password,
  } = req.body || {};

  if (!name || !String(name).trim() || String(name).trim().length < NAME_MIN_LENGTH) {
    return res.status(400).json({ message: `Name must be at least ${NAME_MIN_LENGTH} characters long.` });
  }

  if (!phoneNumber || !isValidPhone(phoneNumber)) {
    return res.status(400).json({ message: 'Phone number is invalid.' });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
    return res.status(400).json({ message: 'A valid email is required.' });
  }

  if (!password || !isStrongPassword(password)) {
    return res.status(400).json({ message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters with uppercase, lowercase, and a number.` });
  }

  req.body.email = normalizeEmail(email);
  return next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body || {};

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
    return res.status(400).json({ message: 'A valid email is required.' });
  }

  if (!password || String(password).length < LOGIN_PASSWORD_MIN_LENGTH) {
    return res.status(400).json({ message: `Password must be at least ${LOGIN_PASSWORD_MIN_LENGTH} characters.` });
  }

  req.body.email = normalizeEmail(email);
  return next();
};

const validateProfileUpdate = (req, res, next) => {
  const {
    name, phoneNumber, email, password,
  } = req.body || {};

  if (name !== undefined && (!String(name).trim() || String(name).trim().length < NAME_MIN_LENGTH)) {
    return res.status(400).json({ message: `Name must be at least ${NAME_MIN_LENGTH} characters long.` });
  }

  if (phoneNumber !== undefined && !isValidPhone(phoneNumber)) {
    return res.status(400).json({ message: 'Phone number is invalid.' });
  }

  if (email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
    return res.status(400).json({ message: 'A valid email is required.' });
  }

  if (password !== undefined && !isStrongPassword(password)) {
    return res.status(400).json({ message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters with uppercase, lowercase, and a number.` });
  }

  if (email !== undefined) {
    req.body.email = normalizeEmail(email);
  }

  return next();
};

const validateProduct = (req, res, next) => {
  const {
    name, brand, category, description, price, countInStock,
  } = req.body || {};

  if (!name || !String(name).trim()) {
    return res.status(400).json({ message: 'Product name is required.' });
  }

  if (!brand || !String(brand).trim()) {
    return res.status(400).json({ message: 'Brand is required.' });
  }

  if (!category || !String(category).trim()) {
    return res.status(400).json({ message: 'Category is required.' });
  }

  if (!description || !String(description).trim()) {
    return res.status(400).json({ message: 'Description is required.' });
  }

  const parsedPrice = Number(price);
  if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
    return res.status(400).json({ message: 'Price must be a non-negative number.' });
  }

  const parsedStock = Number(countInStock);
  if (!Number.isInteger(parsedStock) || parsedStock < 0) {
    return res.status(400).json({ message: 'Stock count must be a non-negative integer.' });
  }

  req.body.price = parsedPrice;
  req.body.countInStock = parsedStock;

  return next();
};

const validateReview = (req, res, next) => {
  const { rating, comment } = req.body || {};

  const parsedRating = Number(rating);
  if (!Number.isFinite(parsedRating) || parsedRating < REVIEW_RATING_MIN || parsedRating > REVIEW_RATING_MAX) {
    return res.status(400).json({ message: `Rating must be between ${REVIEW_RATING_MIN} and ${REVIEW_RATING_MAX}.` });
  }

  if (!comment || !String(comment).trim() || String(comment).trim().length < REVIEW_COMMENT_MIN_LENGTH) {
    return res.status(400).json({ message: `Review text must be at least ${REVIEW_COMMENT_MIN_LENGTH} characters long.` });
  }

  req.body.rating = parsedRating;
  req.body.comment = String(comment).trim();
  return next();
};

const validateOrder = (req, res, next) => {
  const { orderItems, shippingAddress, paymentMethod } = req.body || {};

  if (!Array.isArray(orderItems) || orderItems.length === 0) {
    return res.status(400).json({ message: 'Order must contain at least one item.' });
  }

  for (const item of orderItems) {
    if (!item || !mongoose.isValidObjectId(item.product)) {
      return res.status(400).json({ message: 'Each order item must include a valid product ID.' });
    }

    if (!Number.isInteger(Number(item.qty)) || Number(item.qty) <= 0) {
      return res.status(400).json({ message: 'Each order item must have a valid quantity.' });
    }
  }

  if (!shippingAddress || !shippingAddress.address || !shippingAddress.city || !shippingAddress.postalCode || !shippingAddress.country) {
    return res.status(400).json({ message: 'Shipping address is incomplete.' });
  }

  if (!paymentMethod || !String(paymentMethod).trim()) {
    return res.status(400).json({ message: 'Payment method is required.' });
  }

  return next();
};

const validateUpload = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded.' });
  }

  const mime = req.file.mimetype || '';
  if (!mime.startsWith('image/')) {
    return res.status(400).json({ message: 'Only image uploads are allowed.' });
  }

  if (req.file.size > DEFAULT_UPLOAD_SIZE_BYTES) {
    return res.status(400).json({ message: 'Image size must be under 2MB.' });
  }

  return next();
};

export {
  normalizeEmail,
  isStrongPassword,
  isValidPhone,
  validateIdParam,
  validateRegister,
  validateLogin,
  validateProfileUpdate,
  validateProduct,
  validateReview,
  validateOrder,
  validateUpload,
};
