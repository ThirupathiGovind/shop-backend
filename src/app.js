import path from 'path';
import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import productRoutes from './routes/productRoutes.js';
import userRoutes from './routes/userRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import {
  API_RATE_LIMIT,
  AUTH_RATE_LIMIT,
  DEFAULT_CORS_ORIGIN,
  RATE_LIMIT_WINDOW_MS,
  REQUEST_BODY_LIMIT,
  REVIEW_RATE_LIMIT,
  UPLOAD_RATE_LIMIT,
} from './constants.js';

dotenv.config();

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const allowedOrigins = (process.env.CORS_ORIGIN || DEFAULT_CORS_ORIGIN)
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('CORS policy denied'));
    },
    credentials: true,
  }),
);

const apiLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: isProduction ? API_RATE_LIMIT.production : API_RATE_LIMIT.development,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: isProduction ? AUTH_RATE_LIMIT.production : AUTH_RATE_LIMIT.development,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many auth attempts, please try again later.' },
});

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json({ limit: REQUEST_BODY_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: REQUEST_BODY_LIMIT }));
app.use('/api', apiLimiter);
app.use('/api/users/login', authLimiter);
app.use('/api/users', authLimiter);
app.use('/api/products/:id/reviews', rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: isProduction ? REVIEW_RATE_LIMIT.production : REVIEW_RATE_LIMIT.development,
  standardHeaders: true,
  legacyHeaders: false,
}));
app.use('/api/upload', rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: isProduction ? UPLOAD_RATE_LIMIT.production : UPLOAD_RATE_LIMIT.development,
  standardHeaders: true,
  legacyHeaders: false,
}));

app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/api/config/paypal', (req, res) => res.send(process.env.PAYPAL_CLIENT_ID || ''));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', environment: process.env.NODE_ENV || 'development' });
});

const __dirname = path.resolve();
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '/frontend/build')));

  app.get('*', (req, res) => res.sendFile(path.resolve(__dirname, 'frontend', 'build', 'index.html')));
} else {
  app.get('/', (req, res) => {
    res.send('API is running....');
  });
}

app.use(notFound);
app.use(errorHandler);

export default app;
