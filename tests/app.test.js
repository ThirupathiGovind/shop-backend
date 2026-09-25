import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';

test('GET /health reports the API status', async () => {
  const response = await request(app).get('/health');

  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'ok');
});

test('GET /api/config/paypal returns the configured client id', async () => {
  const previousClientId = process.env.PAYPAL_CLIENT_ID;
  process.env.PAYPAL_CLIENT_ID = 'test-client-id';

  const response = await request(app).get('/api/config/paypal');

  if (previousClientId === undefined) {
    delete process.env.PAYPAL_CLIENT_ID;
  } else {
    process.env.PAYPAL_CLIENT_ID = previousClientId;
  }

  assert.equal(response.status, 200);
  assert.equal(response.text, 'test-client-id');
});

test('unknown routes return a formatted 404 response', async () => {
  const response = await request(app).get('/does-not-exist');

  assert.equal(response.status, 404);
  assert.match(response.body.message, /Not Found/);
});

test('root route reports that the API is running', async () => {
  const response = await request(app).get('/');

  assert.equal(response.status, 200);
  assert.match(response.text, /API is running/);
});

test('CORS rejects an origin outside the configured allowlist', async () => {
  const response = await request(app)
    .get('/health')
    .set('Origin', 'https://not-allowed.example');

  assert.equal(response.status, 500);
  assert.match(response.body.message, /CORS policy denied/);
});
