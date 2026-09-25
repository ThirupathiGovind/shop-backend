import test from 'node:test';
import assert from 'node:assert/strict';

import {
  deleteProduct,
  getProductById,
  updateProduct,
  createProductReview,
} from '../src/controllers/productController.js';
import {
  authUser,
  getUserById,
  deleteUser,
  registerUser,
  getUserProfile,
  updateUserProfile,
  updateUser,
} from '../src/controllers/userController.js';
import {
  updateOrderToPaid,
  addOrderItems,
  getOrderById,
  updateOrderToDelivered,
} from '../src/controllers/orderController.js';
import User from '../src/models/userModel.js';
import Product from '../src/models/productModel.js';
import Order from '../src/models/orderModel.js';
import {
  validateIdParam,
  validateLogin,
  validateOrder,
  validateProduct,
  validateProfileUpdate,
  validateRegister,
  validateReview,
  validateUpload,
} from '../src/middleware/validationMiddleware.js';

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

test('product and user controller error branches are exercised', async () => {
  const originalProductFindById = Product.findById;
  const originalUserFindById = User.findById;

  try {
    Product.findById = async () => null;
    const missingProductRes = createResponse();
    await assert.rejects(
      () => getProductById({ params: { id: 'missing-id' } }, missingProductRes),
      /Product not found/,
    );
    assert.equal(missingProductRes.statusCode, 404);

    Product.findById = async () => ({
      _id: 'product-4',
      name: 'Mouse',
      remove: async () => true,
    });
    const deleteRes = createResponse();
    await deleteProduct({ params: { id: 'product-4' } }, deleteRes);
    assert.equal(deleteRes.body.message, 'Product removed');

    Product.findById = async () => ({
      _id: 'product-5',
      name: 'Headphones',
      save: async () => ({
        _id: 'product-5',
        name: 'Headphones Pro',
      }),
    });
    const updateRes = createResponse();
    await updateProduct({
      params: { id: 'product-5' },
      body: {
        name: 'Headphones Pro',
        price: 199,
        description: 'Updated',
        image: '/images/hp.jpg',
        brand: 'Brand',
        category: 'Audio',
        countInStock: 5,
      },
    }, updateRes);
    assert.equal(updateRes.body.name, 'Headphones Pro');

    Product.findById = async () => ({
      reviews: [{ user: { toString: () => 'user-1' } }],
      save: async () => true,
    });
    const reviewRes = createResponse();
    await assert.rejects(
      () => createProductReview({
        params: { id: 'product-review' },
        user: { _id: 'user-1', name: 'Alice' },
        body: { rating: 5, comment: 'Already reviewed' },
      }, reviewRes),
      /Product already reviewed/,
    );
    assert.equal(reviewRes.statusCode, 400);

    User.findById = async () => ({
      _id: 'user-44',
      name: 'Noah',
      email: 'noah@example.com',
      remove: async () => true,
    });
    const userDeleteRes = createResponse();
    await deleteUser({ params: { id: 'user-44' } }, userDeleteRes);
    assert.equal(userDeleteRes.body.message, 'User removed');

    User.findById = () => ({
      _id: 'user-88',
      name: 'Mia',
      email: 'mia@example.com',
      select() { return this; },
    });
    const userByIdRes = createResponse();
    await getUserById({ params: { id: 'user-88' } }, userByIdRes);
    assert.equal(userByIdRes.body.name, 'Mia');
  } finally {
    Product.findById = originalProductFindById;
    User.findById = originalUserFindById;
  }
});

test('order payment and not-found branches are covered', async () => {
  const originalOrderFindById = Order.findById;
  const originalProductFindById = Product.findById;
  const originalProductFindOneAndUpdate = Product.findOneAndUpdate;

  try {
    Order.findById = async () => null;
    const notFoundRes = createResponse();
    await assert.rejects(
      () => updateOrderToPaid({
        params: { id: 'order-404' },
        user: { _id: 'user-1' },
        body: { id: 'payer-1' },
      }, notFoundRes),
      /Order not found/,
    );
    assert.equal(notFoundRes.statusCode, 404);

    Order.findById = async () => ({
      _id: 'order-1',
      user: { toString: () => 'user-2' },
      isPaid: false,
      paymentResult: null,
      orderItems: [{ product: 'product-77', qty: 1, name: 'Widget' }],
      save: async function save() { return this; },
    });

    Product.findById = async () => ({
      _id: 'product-77',
      name: 'Widget',
    });
    Product.findOneAndUpdate = async () => ({
      _id: 'product-77',
      countInStock: 0,
    });

    const paidRes = createResponse();
    await updateOrderToPaid({
      params: { id: 'order-1' },
      user: { _id: 'user-1', isAdmin: true },
      body: {
        id: 'pay-1',
        status: 'COMPLETED',
        update_time: '2024-01-01',
        payer: { email_address: 'a@example.com' },
      },
    }, paidRes);

    assert.equal(paidRes.body.isPaid, true);
  } finally {
    Order.findById = originalOrderFindById;
    Product.findById = originalProductFindById;
    Product.findOneAndUpdate = originalProductFindOneAndUpdate;
  }
});

test('validation middleware rejects invalid request variants', () => {
  const cases = [
    [{ body: {} }, validateRegister],
    [{ body: { name: 'Valid Name' } }, validateRegister],
    [{ body: { name: 'Valid Name', phoneNumber: '+15551234567' } }, validateRegister],
    [{
      body: {
        name: 'Valid Name', phoneNumber: 'bad', email: 'valid@example.com', password: 'Secure123',
      },
    }, validateRegister],
    [{
      body: {
        name: 'Valid Name', phoneNumber: '+15551234567', email: 'bad', password: 'Secure123',
      },
    }, validateRegister],
    [{
      body: {
        name: 'Valid Name', phoneNumber: '+15551234567', email: 'valid@example.com', password: 'weak',
      },
    }, validateRegister],
    [{ body: { email: 'bad', password: 'short' } }, validateLogin],
    [{ body: { email: 'valid@example.com', password: 'short' } }, validateLogin],
    [{ body: { phoneNumber: 'bad' } }, validateProfileUpdate],
    [{ body: { email: 'bad' } }, validateProfileUpdate],
    [{ body: { password: 'weak' } }, validateProfileUpdate],
    [{ body: { name: 'A' } }, validateProfileUpdate],
    [{
      body: {
        name: '', brand: 'Brand', category: 'Cat', description: 'Desc', price: 1, countInStock: 1,
      },
    }, validateProduct],
    [{
      body: {
        name: 'Name', brand: '', category: 'Cat', description: 'Desc', price: 1, countInStock: 1,
      },
    }, validateProduct],
    [{
      body: {
        name: 'Name', brand: 'Brand', category: '', description: 'Desc', price: 1, countInStock: 1,
      },
    }, validateProduct],
    [{
      body: {
        name: 'Name', brand: 'Brand', category: 'Cat', description: '', price: 1, countInStock: 1,
      },
    }, validateProduct],
    [{
      body: {
        name: 'Name', brand: 'Brand', category: 'Cat', description: 'Desc', price: -1, countInStock: 1,
      },
    }, validateProduct],
    [{
      body: {
        name: 'Name', brand: 'Brand', category: 'Cat', description: 'Desc', price: 1, countInStock: -1,
      },
    }, validateProduct],
    [{ body: { rating: 5, comment: '' } }, validateReview],
    [{ body: { rating: 0, comment: 'Valid comment' } }, validateReview],
    [{ body: { orderItems: [{}] } }, validateOrder],
    [{ body: { orderItems: [{ product: '507f1f77bcf86cd799439011', qty: 0 }] } }, validateOrder],
    [{ body: { orderItems: [{ product: '507f1f77bcf86cd799439011', qty: 1 }], shippingAddress: {} } }, validateOrder],
    [{
      body: {
        orderItems: [{ product: '507f1f77bcf86cd799439011', qty: 1 }],
        shippingAddress: {
          address: 'A', city: 'B', postalCode: 'C', country: 'D',
        },
      },
    }, validateOrder],
    [{
      body: {
        orderItems: [{ product: '507f1f77bcf86cd799439011', qty: 1 }],
        shippingAddress: {
          address: 'A', city: 'B', postalCode: 'C', country: 'D',
        },
      },
    }, validateOrder],
    [{
      body: {
        orderItems: [{ product: '507f1f77bcf86cd799439011', qty: 1 }],
        shippingAddress: {
          address: 'A', city: 'B', postalCode: 'C', country: 'D',
        },
        paymentMethod: '',
      },
    }, validateOrder],
    [{ file: { mimetype: 'image/png', size: 3 * 1024 * 1024 } }, validateUpload],
    [{}, validateUpload],
    [{ file: { mimetype: 'application/pdf', size: 1 } }, validateUpload],
  ];

  for (const [req, middleware] of cases) {
    const res = createResponse();
    let called = false;
    middleware(req, res, () => { called = true; });
    assert.equal(called, false);
    assert.equal(res.statusCode, 400);
  }

  const idRes = createResponse();
  validateIdParam({ params: { id: 'invalid-id' } }, idRes, () => {});
  assert.equal(idRes.statusCode, 400);
});

test('user model methods compare passwords and hash modified passwords', async () => {
  const user = new User({
    name: 'Model User',
    phoneNumber: '+15551234567',
    email: 'model@example.com',
    password: 'Secure123',
  });

  assert.equal(await user.matchPassword('Secure123'), false);
  const saveHook = User.schema.s.hooks._pres.get('save')
    .find((hook) => hook.fn.name === 'hashPassword').fn;
  user.isModified = () => true;
  await saveHook.call(user, () => {});
  assert.notEqual(user.password, 'Secure123');
  assert.equal(await user.matchPassword('Secure123'), true);

  user.isModified = () => false;
  let nextCalled = false;
  await saveHook.call(user, () => { nextCalled = true; });
  assert.equal(nextCalled, true);
});

test('order controller rejects invalid order, access, stock, and delivery states', async () => {
  const originalProductFindById = Product.findById;
  const originalOrderFindById = Order.findById;

  try {
    const emptyRes = createResponse();
    await assert.rejects(
      () => addOrderItems({ body: { orderItems: [] } }, emptyRes),
      /No order items/,
    );

    Product.findById = async () => null;
    const missingProductRes = createResponse();
    await assert.rejects(
      () => addOrderItems({ body: { orderItems: [{ product: 'missing', qty: 1 }] } }, missingProductRes),
      /Product not found/,
    );

    Product.findById = async () => ({ name: 'Widget', countInStock: 0 });
    const stockRes = createResponse();
    await assert.rejects(
      () => addOrderItems({ body: { orderItems: [{ product: 'product-1', qty: 1 }] } }, stockRes),
      /Not enough stock/,
    );

    Order.findById = () => ({
      populate: async () => null,
    });
    const orderMissingRes = createResponse();
    await assert.rejects(
      () => getOrderById({ params: { id: 'missing' }, user: { _id: 'user-1' } }, orderMissingRes),
      /Order not found/,
    );

    Order.findById = () => ({
      populate: async () => ({
        user: { _id: 'other-user' },
      }),
    });
    const forbiddenRes = createResponse();
    await assert.rejects(
      () => getOrderById({ params: { id: 'order-1' }, user: { _id: 'user-1', isAdmin: false } }, forbiddenRes),
      /Not authorized to view/,
    );

    Order.findById = async () => null;
    const deliveryRes = createResponse();
    await assert.rejects(
      () => updateOrderToDelivered({ params: { id: 'missing' } }, deliveryRes),
      /Order not found/,
    );
  } finally {
    Product.findById = originalProductFindById;
    Order.findById = originalOrderFindById;
  }
});

test('remaining product and user controller branches are covered', async () => {
  const originalProductFindById = Product.findById;
  const originalUserFindById = User.findById;
  const originalUserFindOne = User.findOne;
  const originalUserCreate = User.create;

  try {
    Product.findById = async () => null;
    const productDeleteRes = createResponse();
    await assert.rejects(
      () => deleteProduct({ params: { id: 'missing-product' } }, productDeleteRes),
      /Product not found/,
    );

    const reviewMissingRes = createResponse();
    await assert.rejects(
      () => createProductReview({
        params: { id: 'missing-product' },
        user: { _id: 'user-1', name: 'Alice' },
        body: { rating: 5, comment: 'Nice product' },
      }, reviewMissingRes),
      /Product not found/,
    );

    Product.findById = async () => null;
    const productUpdateRes = createResponse();
    await assert.rejects(
      () => updateProduct({ params: { id: 'missing-product' }, body: {} }, productUpdateRes),
      /Product not found/,
    );

    User.findOne = async () => null;
    User.create = async () => null;
    const registerRes = createResponse();
    await assert.rejects(
      () => registerUser({
        body: {
          name: 'New User', phoneNumber: '+15551234567', email: 'new@example.com', password: 'Secure123',
        },
      }, registerRes),
      /Invalid user data/,
    );

    User.findOne = async () => null;
    const authRes = createResponse();
    await assert.rejects(
      () => authUser({ body: { email: 'missing@example.com', password: 'Secure123' } }, authRes),
      /Invalid email or password/,
    );

    User.findById = async () => null;
    const profileRes = createResponse();
    await assert.rejects(
      () => getUserProfile({ user: { _id: 'missing-user' } }, profileRes),
      /User not found/,
    );
    const updateProfileRes = createResponse();
    await assert.rejects(
      () => updateUserProfile({ user: { _id: 'missing-user' }, body: {} }, updateProfileRes),
      /User not found/,
    );

    const updateUserRes = createResponse();
    await assert.rejects(
      () => updateUser({ params: { id: 'missing-user' }, body: {} }, updateUserRes),
      /User not found/,
    );
  } finally {
    Product.findById = originalProductFindById;
    User.findById = originalUserFindById;
    User.findOne = originalUserFindOne;
    User.create = originalUserCreate;
  }
});
