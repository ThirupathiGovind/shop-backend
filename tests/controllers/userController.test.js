import test from 'node:test';
import assert from 'node:assert/strict';

import {
  authUser,
  getUserProfile,
  registerUser,
  updateUserProfile,
} from '../../src/controllers/userController.js';
import User from '../../src/models/userModel.js';

process.env.JWT_SECRET = 'test-secret';

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

test('authUser and registerUser handle success and auth failures', async () => {
  const originalFindOne = User.findOne;
  const originalCreate = User.create;

  try {
    User.findOne = async ({ email: lookupEmail }) => {
      if (lookupEmail === 'alice@example.com') {
        return {
          _id: 'user-1',
          name: 'Alice',
          email: 'alice@example.com',
          isAdmin: false,
          matchPassword: async () => true,
        };
      }

      return null;
    };

    const authRes = createResponse();
    await authUser({ body: { email: 'alice@example.com', password: 'StrongPass123' } }, authRes);

    assert.equal(authRes.body.email, 'alice@example.com');
    assert.ok(authRes.body.token);

    const invalidRes = createResponse();
    await assert.rejects(
      () => authUser({ body: { email: 'nobody@example.com', password: 'Wrong123' } }, invalidRes),
      /Invalid email or password/,
    );
    assert.equal(invalidRes.statusCode, 401);

    User.findOne = async ({ email: lookupEmail }) => {
      if (lookupEmail === 'new@example.com') {
        return { _id: 'existing-user' };
      }

      return null;
    };
    await assert.rejects(
      () => registerUser({
        body: {
          name: 'New User',
          phoneNumber: '+15551234567',
          email: 'new@example.com',
          password: 'StrongPass123',
        },
      }, createResponse()),
      /User already exists/,
    );

    User.findOne = async () => null;
    User.create = async (payload) => ({
      _id: 'created-user',
      name: payload.name,
      phoneNumber: payload.phoneNumber,
      email: payload.email,
      isAdmin: false,
    });

    const registerRes = createResponse();
    await registerUser({
      body: {
        name: 'New User',
        phoneNumber: '+15551234567',
        email: 'fresh@example.com',
        password: 'StrongPass123',
      },
    }, registerRes);

    assert.equal(registerRes.statusCode, 201);
    assert.equal(registerRes.body.email, 'fresh@example.com');
    assert.ok(registerRes.body.token);
  } finally {
    User.findOne = originalFindOne;
    User.create = originalCreate;
  }
});

test('getUserProfile and updateUserProfile return and update the authenticated user', async () => {
  const originalFindById = User.findById;

  try {
    User.findById = async () => ({
      _id: 'user-1',
      name: 'Alice',
      phoneNumber: '+15551234567',
      email: 'alice@example.com',
      isAdmin: false,
    });

    const profileRes = createResponse();
    await getUserProfile({ user: { _id: 'user-1' } }, profileRes);
    assert.equal(profileRes.body.email, 'alice@example.com');

    User.findById = async () => ({
      _id: 'user-1',
      name: 'Alice',
      phoneNumber: '+15551234567',
      email: 'alice@example.com',
      isAdmin: false,
      save: async () => ({
        _id: 'user-1',
        name: 'Alice Updated',
        phoneNumber: '+15551234567',
        email: 'alice@updated.com',
        isAdmin: false,
      }),
    });

    const updateRes = createResponse();
    await updateUserProfile({
      user: { _id: 'user-1' },
      body: {
        name: 'Alice Updated',
        email: 'alice@updated.com',
        password: 'StrongPass123',
      },
    }, updateRes);

    assert.equal(updateRes.body.name, 'Alice Updated');
    assert.equal(updateRes.body.email, 'alice@updated.com');
    assert.ok(updateRes.body.token);
  } finally {
    User.findById = originalFindById;
  }
});
