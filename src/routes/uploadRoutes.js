import path from 'path';
import crypto from 'crypto';
import express from 'express';
import multer from 'multer';
import { protect, admin } from '../middleware/authMiddleware.js';
import { validateUpload } from '../middleware/validationMiddleware.js';
import { DEFAULT_UPLOAD_SIZE_BYTES } from '../constants.js';

const router = express.Router();

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
    return;
  }

  cb(new Error('Only JPG, PNG, and WEBP images are allowed.'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: Number(process.env.MAX_UPLOAD_SIZE || DEFAULT_UPLOAD_SIZE_BYTES),
  },
});

router.post('/', protect, admin, upload.single('image'), validateUpload, (req, res) => {
  const extension = path.extname(req.file.originalname) || '.png';
  const fileName = `${crypto.randomBytes(12).toString('hex')}${extension}`;

  res.status(201).json({
    message: 'Image uploaded successfully',
    image: `/uploads/${fileName}`,
  });
});

export default router;
