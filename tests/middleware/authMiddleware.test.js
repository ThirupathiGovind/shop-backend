import test from 'node:test';
import assert from 'node:assert/strict';

import { protect, admin } from '../../src/middleware/authMiddleware.js';
import User from '../../src/models/userModel.js';
import generateToken from '../../src/utils/generateToken.js';

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

test('protect accepts valid bearer tokens and rejects missing or invalid ones', async () => {
  process.env.JWT_SECRET = 'test-secret';
  const originalFindById = User.findById;
  const dbUser = {
    _id: 'user-123',
    name: 'Jane Doe',
    isAdmin: false,
    select() {
      return this;
    },
  };

  User.findById = () => dbUser;

  try {
    const validReq = {
      headers: {
        authorization: `Bearer ${generateToken('user-123')}`,
      },
    };
    const validRes = createResponse();
    let passed = false;

    await protect(validReq, validRes, () => {
      passed = true;
    });

    assert.equal(passed, true);
    assert.equal(validReq.user._id, 'user-123');

    const missingTokenReq = { headers: {} };
    const missingTokenRes = createResponse();
    let missingError;

    await protect(missingTokenReq, missingTokenRes, (err) => {
      missingError = err;
    });

    assert.equal(missingTokenRes.statusCode, 401);
    assert.match(missingError.message, /Not authorized, no token/);

    const invalidTokenReq = {
      headers: {
        authorization: 'Bearer not-a-real-token',
      },
    };
    const invalidTokenRes = createResponse();
    let invalidError;

    await protect(invalidTokenReq, invalidTokenRes, (err) => {
      invalidError = err;
    });

    assert.equal(invalidTokenRes.statusCode, 401);
    assert.match(invalidError.message, /Not authorized, token failed/);
  } finally {
    User.findById = originalFindById;
  }
});

test('admin only allows administrators', () => {
  const allowedReq = { user: { isAdmin: true } };
  const blockedReq = { user: { isAdmin: false } };
  const res = createResponse();
  let called = false;

  admin(allowedReq, res, () => {
    called = true;
  });
  assert.equal(called, true);

  assert.throws(
    () => admin(blockedReq, res, () => {}),
    /Not authorized as an admin/,
  );
  assert.equal(res.statusCode, 403);
});
