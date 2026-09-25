import test from 'node:test';
import assert from 'node:assert/strict';

import { admin, protect } from '../../src/middleware/authMiddleware.js';

const createResponse = () => ({
  statusCode: 200,
  body: undefined,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(payload) {
    this.body = payload;
    return this;
  },
});

test('admin guard and protect fallthrough branches are exercised', async () => {
  const res = createResponse();

  const next = () => { res.nextCalled = true; };
  admin({ user: { isAdmin: true } }, res, next);
  assert.equal(res.nextCalled, true);

  const forbiddenRes = createResponse();
  assert.throws(
    () => admin({ user: { isAdmin: false } }, forbiddenRes, () => {}),
    /Not authorized as an admin/,
  );
  assert.equal(forbiddenRes.statusCode, 403);

  const protectedRes = createResponse();
  let missingError;
  await protect({ headers: {} }, protectedRes, (err) => {
    missingError = err;
  });
  assert.equal(protectedRes.statusCode, 401);
  assert.match(missingError.message, /Not authorized, no token/);
});
