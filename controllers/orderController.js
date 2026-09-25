import asyncHandler from 'express-async-handler'
import Order from '../models/orderModel.js'
import Product from '../models/productModel.js'
import { DEFAULT_SHIPPING_PRICE } from '../constants.js'

const calculateOrderTotals = (orderItems) => {
  const itemsPrice = orderItems.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.qty),
    0
  )

  const taxRate = Number(process.env.TAX_RATE || 0.1)
  const shippingPrice = itemsPrice > 0 ? Number(process.env.SHIPPING_PRICE || DEFAULT_SHIPPING_PRICE) : 0
  const taxPrice = Number((itemsPrice * taxRate).toFixed(2))
  const totalPrice = Number((itemsPrice + taxPrice + shippingPrice).toFixed(2))

  return {
    itemsPrice: Number(itemsPrice.toFixed(2)),
    taxPrice,
    shippingPrice: Number(shippingPrice.toFixed(2)),
    totalPrice,
  }
}

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const addOrderItems = asyncHandler(async (req, res) => {
  const { orderItems, shippingAddress, paymentMethod } = req.body

  if (!Array.isArray(orderItems) || orderItems.length === 0) {
    res.status(400)
    throw new Error('No order items')
  }

  const normalizedItems = []

  for (const item of orderItems) {
    const product = await Product.findById(item.product)

    if (!product) {
      res.status(404)
      throw new Error(`Product not found: ${item.product}`)
    }

    const quantity = Number(item.qty)

    if (!Number.isInteger(quantity) || quantity <= 0) {
      res.status(400)
      throw new Error(`Invalid quantity for product ${product.name}`)
    }

    if (product.countInStock < quantity) {
      res.status(400)
      throw new Error(`Not enough stock for ${product.name}`)
    }

    normalizedItems.push({
      name: product.name,
      qty: quantity,
      image: product.image,
      price: product.price,
      product: product._id,
    })
  }

  const pricing = calculateOrderTotals(normalizedItems)

  const order = new Order({
    orderItems: normalizedItems,
    user: req.user._id,
    shippingAddress,
    paymentMethod,
    ...pricing,
  })

  const createdOrder = await order.save()

  res.status(201).json(createdOrder)
})

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate(
    'user',
    'name email'
  )

  if (!order) {
    res.status(404)
    throw new Error('Order not found')
  }

  if (order.user && order.user._id.toString() !== req.user._id.toString() && !req.user.isAdmin) {
    res.status(403)
    throw new Error('Not authorized to view this order')
  }

  res.json(order)
})

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)

  if (!order) {
    res.status(404)
    throw new Error('Order not found')
  }

  if (order.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
    res.status(403)
    throw new Error('Not authorized to pay this order')
  }

  if (order.isPaid && order.paymentResult?.id === req.body.id) {
    return res.json(order)
  }

  for (const item of order.orderItems) {
    const product = await Product.findById(item.product)

    if (!product) {
      res.status(404)
      throw new Error(`Product not found for order item: ${item.name}`)
    }

    const updatedProduct = await Product.findOneAndUpdate(
      { _id: item.product, countInStock: { $gte: item.qty } },
      { $inc: { countInStock: -item.qty } },
      { new: true }
    )

    if (!updatedProduct) {
      res.status(409)
      throw new Error(`Insufficient stock to complete payment for ${item.name}`)
    }
  }

  order.isPaid = true
  order.paidAt = Date.now()
  order.paymentResult = {
    id: req.body.id,
    status: req.body.status,
    update_time: req.body.update_time,
    email_address: req.body.payer?.email_address,
  }

  const updatedOrder = await order.save()

  res.json(updatedOrder)
})

// @desc    Update order to delivered
// @route   PUT /api/orders/:id/deliver
// @access  Private/Admin
const updateOrderToDelivered = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)

  if (order) {
    order.isDelivered = true
    order.deliveredAt = Date.now()

    const updatedOrder = await order.save()

    res.json(updatedOrder)
  } else {
    res.status(404)
    throw new Error('Order not found')
  }
})

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
  res.json(orders)
})

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({}).populate('user', 'id name')
  res.json(orders)
})

export {
  addOrderItems,
  getOrderById,
  updateOrderToPaid,
  updateOrderToDelivered,
  getMyOrders,
  getOrders,
}
