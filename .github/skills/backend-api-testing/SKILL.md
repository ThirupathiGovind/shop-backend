---
name: backend-api-testing
description: 'Use when adding or reviewing Express, Mongoose, middleware, controller, route, authentication, validation, upload, or order API tests in shop-backend.'
user-invocable: true
---

# Backend API Testing

## Procedure

1. Read the owning controller, middleware, model, route, and an adjacent test.
2. Mirror the source tree under `tests` so each folder has matching coverage (for example `tests/controllers`, `tests/middleware`, `tests/config`, `tests/utils`).
3. Prefer importing `app.js` and testing HTTP behavior with `supertest`.
4. Mock or isolate database and external payment boundaries; never use production data.
5. Cover success, invalid input, missing resources, authorization failures, and error middleware behavior.
6. For orders, cover quantity validation, stock limits, pricing, payment idempotency, and ownership/admin checks.
7. Run `node --test <target>`, then `npm run lint` and `npm run test:coverage`.
8. Check coverage for uncovered authored modules, not only the global percentage.

## Commands

Run from `shop-backend`:

- `npm run lint`
- `npm test`
- `npm run test:coverage`
- `npm run quality`

Do not run `npm run data:destroy` as part of a test workflow.
