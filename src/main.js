import 'colors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import app from './app.js';
import { DEFAULT_PORT } from './constants.js';

dotenv.config();

connectDB();

const PORT = Number(process.env.PORT || DEFAULT_PORT);

app.listen(
  PORT,
  () => console.log(
    `Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`.yellow.bold,
  ),
);
