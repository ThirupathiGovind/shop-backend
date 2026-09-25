import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';

import generateToken from '../../src/utils/generateToken.js';

test('generateToken signs a valid JWT for the provided user id', () => {
  process.env.JWT_SECRET = 'test-secret';

  const token = generateToken('user-123');
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  assert.equal(decoded.id, 'user-123');
  assert.ok(decoded.exp > Math.floor(Date.now() / 1000));
});
