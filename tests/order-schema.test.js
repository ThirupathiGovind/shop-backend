import test from 'node:test'
import assert from 'node:assert/strict'
import Order from '../models/orderModel.js'

test('Order schema includes itemsPrice and required pricing fields', () => {
  const schemaFields = Object.keys(Order.schema.paths)

  assert.ok(schemaFields.includes('itemsPrice'))
  assert.ok(schemaFields.includes('taxPrice'))
  assert.ok(schemaFields.includes('shippingPrice'))
  assert.ok(schemaFields.includes('totalPrice'))
})
