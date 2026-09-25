import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isStrongPassword,
  normalizeEmail,
  validateLogin,
  validateProduct,
  validateRegister,
} from '../../src/middleware/validationMiddleware.js';

const createResponse = () => ({
  statusCode: 200,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

test('normalizes email addresses and validates strong passwords', () => {
  assert.equal(normalizeEmail('  USER@Example.COM '), 'user@example.com');
  assert.equal(isStrongPassword('Secure123'), true);
  assert.equal(isStrongPassword('weak'), false);
});

test('validateRegister normalizes valid input', () => {
  const req = {
    body: {
      name: 'John Doe',
      phoneNumber: '+15551234567',
      email: 'USER@example.com',
      password: 'Secure123',
    },
  };
  const res = createResponse();
  let called = false;

  validateRegister(req, res, () => {
    called = true;
  });

  assert.equal(called, true);
  assert.equal(req.body.email, 'user@example.com');
  assert.equal(res.statusCode, 200);
});

test('validateLogin rejects an invalid email', () => {
  const req = { body: { email: 'invalid', password: 'Secure123' } };
  const res = createResponse();
  let called = false;

  validateLogin(req, res, () => {
    called = true;
  });

  assert.equal(called, false);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.message, 'A valid email is required.');
});

test('validateProduct parses numeric values', () => {
  const req = {
    body: {
      name: 'Phone',
      brand: 'Example',
      category: 'Electronics',
      description: 'A product description',
      price: '99.99',
      countInStock: '4',
    },
  };
  const res = createResponse();
  let called = false;

  validateProduct(req, res, () => {
    called = true;
  });

  assert.equal(called, true);
  assert.equal(req.body.price, 99.99);
  assert.equal(req.body.countInStock, 4);
});
