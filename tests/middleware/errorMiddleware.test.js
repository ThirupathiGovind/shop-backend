import test from 'node:test';
import assert from 'node:assert/strict';

import { errorHandler, notFound } from '../../src/middleware/errorMiddleware.js';

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

test('notFound and errorHandler return structured failure payloads', () => {
  const req = { originalUrl: '/missing' };
  const res = createResponse();
  const next = (err) => {
    assert.match(err.message, /Not Found - \/missing/);
  };

  notFound(req, res, next);
  assert.equal(res.statusCode, 404);

  const errorRes = createResponse();
  errorHandler(new Error('Something went wrong'), req, errorRes, () => {});

  assert.equal(errorRes.statusCode, 500);
  assert.equal(errorRes.body.message, 'Something went wrong');
  assert.ok(errorRes.body.stack.includes('Something went wrong'));
});
