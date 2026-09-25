import test from 'node:test';
import assert from 'node:assert/strict';

import { addOrderItems, getOrderById, updateOrderToPaid } from '../../src/controllers/orderController.js';
import Order from '../../src/models/orderModel.js';
import Product from '../../src/models/productModel.js';

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

test('addOrderItems, getOrderById, and updateOrderToPaid follow the order lifecycle safely', async () => {
  const originalProductFindById = Product.findById;
  const originalOrderFindById = Order.findById;
  const originalProductFindOneAndUpdate = Product.findOneAndUpdate;

  try {
    Product.findById = async () => ({
      _id: 'product-1',
      name: 'Laptop',
      image: '/images/laptop.jpg',
      price: 999,
      countInStock: 10,
    });

    Order.prototype.save = async function save() {
      return this;
    };

    const orderCreateRes = createResponse();
    await addOrderItems({
      user: { _id: 'user-1' },
      body: {
        orderItems: [{ product: 'product-1', qty: 1 }],
        shippingAddress: {
          address: '1 Main St',
          city: 'Austin',
          postalCode: '78701',
          country: 'US',
        },
        paymentMethod: 'PayPal',
      },
    }, orderCreateRes);

    assert.equal(orderCreateRes.statusCode, 201);
    assert.equal(orderCreateRes.body.orderItems[0].name, 'Laptop');

    Order.findById = () => ({
      populate() {
        return {
          _id: 'order-1',
          user: {
            _id: 'user-1',
            name: 'Alice',
            email: 'alice@example.com',
          },
          orderItems: [{
            name: 'Laptop',
            qty: 1,
            price: 999,
            product: 'product-1',
          }],
        };
      },
    });

    const orderRes = createResponse();
    await getOrderById({
      params: {
        id: 'order-1',
      },
      user: {
        _id: 'user-1',
        isAdmin: true,
      },
    }, orderRes);

    assert.equal(orderRes.body.user.name, 'Alice');

    const paidOrder = {
      _id: 'order-1',
      user: { toString: () => 'user-1' },
      orderItems: [{ name: 'Laptop', product: 'product-1', qty: 1 }],
      isPaid: false,
      paymentResult: null,
      save: async function save() {
        return this;
      },
    };

    Order.findById = async () => paidOrder;
    Product.findById = async () => ({
      _id: 'product-1',
      name: 'Laptop',
    });
    Product.findOneAndUpdate = async () => ({
      _id: 'product-1',
      countInStock: 9,
    });

    const payRes = createResponse();
    await updateOrderToPaid({
      params: { id: 'order-1' },
      user: { _id: 'user-1', isAdmin: false },
      body: {
        id: 'paypal-id',
        status: 'COMPLETED',
        update_time: '2024-01-01',
        payer: { email_address: 'alice@example.com' },
      },
    }, payRes);

    assert.equal(payRes.body.isPaid, true);
    assert.equal(payRes.body.paymentResult.id, 'paypal-id');
  } finally {
    Product.findById = originalProductFindById;
    Order.findById = originalOrderFindById;
    Product.findOneAndUpdate = originalProductFindOneAndUpdate;
  }
});
