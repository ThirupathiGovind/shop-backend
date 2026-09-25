import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createProductReview,
  getProductById,
  getProducts,
} from '../../src/controllers/productController.js';
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

test('getProducts, getProductById, and createProductReview handle successful success paths', async () => {
  const originalCountDocuments = Product.countDocuments;
  const originalFind = Product.find;
  const originalProductById = Product.findById;

  try {
    Product.countDocuments = async () => 1;
    Product.find = () => ({
      limit() {
        return {
          skip() {
            return [{ _id: 'product-1', name: 'Laptop' }];
          },
        };
      },
    });

    const productsRes = createResponse();
    await getProducts({ query: { pageNumber: '1' } }, productsRes);
    assert.equal(productsRes.body.products[0].name, 'Laptop');
    assert.equal(productsRes.body.page, 1);

    Product.findById = async () => ({
      _id: 'product-1',
      name: 'Laptop',
      reviews: [],
      save: async () => true,
    });

    const productRes = createResponse();
    await getProductById({ params: { id: 'product-1' } }, productRes);
    assert.equal(productRes.body.name, 'Laptop');

    const reviewRes = createResponse();
    await createProductReview({
      params: { id: 'product-1' },
      user: { _id: 'user-1', name: 'Alice' },
      body: { rating: 5, comment: 'Great product' },
    }, reviewRes);

    assert.equal(reviewRes.statusCode, 201);
    assert.equal(reviewRes.body.message, 'Review added');
  } finally {
    Product.countDocuments = originalCountDocuments;
    Product.find = originalFind;
    Product.findById = originalProductById;
  }
});
