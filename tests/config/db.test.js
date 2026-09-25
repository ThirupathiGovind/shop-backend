import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import 'colors';

import connectDB from '../../src/config/db.js';

test('connectDB logs the MongoDB host when the connection succeeds', async () => {
  const originalConnect = mongoose.connect;
  const originalConsoleLog = console.log;
  let called = false;

  mongoose.connect = async () => ({
    connection: { host: 'mongo.example.com' },
  });
  console.log = (...args) => {
    called = true;
    assert.match(String(args[0]), /MongoDB Connected/);
  };

  try {
    process.env.MONGO_URI = 'mongodb://localhost:27017/test';
    await connectDB();
    assert.equal(called, true);
  } finally {
    mongoose.connect = originalConnect;
    console.log = originalConsoleLog;
  }
});
