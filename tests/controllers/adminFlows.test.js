import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getOrders,
  getMyOrders,
  updateOrderToDelivered,
} from '../../src/controllers/orderController.js';
import Order from '../../src/models/orderModel.js';

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

test('admin order flows cover delivered and list endpoints', async () => {
  const originalFind = Order.find;
  const originalFindById = Order.findById;

  try {
    Order.find = (query) => {
      if (query && query.user) {
        return [{ _id: 'order-my' }];
      }

      return {
        populate() {
          return [{ _id: 'order-all' }];
        },
      };
    };

    const ordersRes = createResponse();
    await getOrders({}, ordersRes);
    assert.equal(ordersRes.body[0]._id, 'order-all');

    const myOrdersRes = createResponse();
    await getMyOrders({ user: { _id: 'user-1' } }, myOrdersRes);
    assert.equal(myOrdersRes.body[0]._id, 'order-my');

    Order.findById = async () => ({
      _id: 'order-delivered',
      save: async function save() {
        return this;
      },
    });

    const deliveredRes = createResponse();
    await updateOrderToDelivered({ params: { id: 'order-delivered' } }, deliveredRes);
    assert.equal(deliveredRes.body._id, 'order-delivered');
  } finally {
    Order.find = originalFind;
    Order.findById = originalFindById;
  }
});
