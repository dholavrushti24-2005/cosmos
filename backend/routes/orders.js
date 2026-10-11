// backend/routes/orders.js
// User-side: place an order (from cart), view own order history.
// Admin-side: order management (update status, view all).

const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const User = require('../models/User');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { sendOrderConfirmationEmail, sendOrderStatusEmail } = require('../utils/mailer');

function cleanOrder(o) {
  if (!o) return null;
  const obj = o.toObject ? o.toObject() : { ...o };
  delete obj._id;
  delete obj.__v;
  return obj;
}

// POST /api/orders/apply-coupon — validates promo codes
router.post('/apply-coupon', async (req, res) => {
  try {
    const { code, subtotal } = req.body;
    if (!code) {
      return res.status(400).json({ message: 'Please enter a coupon code.' });
    }
    const orderSubtotal = Number(subtotal) || 0;
    const cleanCode = code.trim().toUpperCase();

    let discount = 0;
    let description = '';

    if (cleanCode === 'COSMOS20') {
      discount = Math.round(orderSubtotal * 0.20);
      description = '20% OFF applied from Welcome Coupon!';
    } else if (cleanCode === 'WELCOME10') {
      discount = Math.round(orderSubtotal * 0.10);
      description = '10% OFF Welcome discount applied!';
    } else if (cleanCode === 'FLAT100') {
      if (orderSubtotal < 1500) {
        return res.status(400).json({ message: 'FLAT100 requires a minimum order of ₹1,500.' });
      }
      discount = 100;
      description = 'Flat ₹100 OFF applied!';
    } else if (cleanCode === 'FLAT500') {
      if (orderSubtotal < 3000) {
        return res.status(400).json({ message: 'FLAT500 requires a minimum order of ₹3,000.' });
      }
      discount = 500;
      description = 'Flat ₹500 Mega discount applied!';
    } else {
      return res.status(400).json({ message: 'Invalid coupon code. Try COSMOS20, FLAT100, or FLAT500.' });
    }

    discount = Math.min(discount, orderSubtotal);
    const finalTotal = Math.max(0, orderSubtotal - discount);

    res.json({
      valid: true,
      code: cleanCode,
      discount,
      finalTotal,
      description,
    });
  } catch (err) {
    console.error('Coupon apply error:', err);
    res.status(500).json({ message: 'Error checking coupon code.' });
  }
});

// POST /api/orders — places an order from the given cart items
router.post('/', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'user') {
      return res.status(403).json({ message: 'Not a user account.' });
    }

    const { items, shipping, payment, paymentStatus, transactionId, discount, couponCode } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty.' });
    }
    if (!shipping || !shipping.name || !shipping.phone || !shipping.address || !shipping.city || !shipping.pincode) {
      return res.status(400).json({ message: 'Please fill in all shipping details.' });
    }

    const productIds = items.map(ci => ci.id);
    const products = await Product.find({ id: { $in: productIds } }).lean();
    const productMap = new Map(products.map(p => [p.id, p]));

    const orderItems = [];
    for (const ci of items) {
      const product = productMap.get(ci.id);
      if (!product) {
        return res.status(400).json({ message: `Product ${ci.id} is no longer available.` });
      }
      orderItems.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image || '',
        qty: Number(ci.qty) || 1,
        size: ci.size || null,
      });
    }

    const subtotal = orderItems.reduce((sum, i) => sum + i.price * i.qty, 0);
    const finalDiscount = Number(discount) || 0;
    const finalTotal = Math.max(0, subtotal - finalDiscount);

    const chosenPayment = payment || 'cod';
    const finalPaymentStatus = paymentStatus || (chosenPayment === 'cod' ? 'pending' : 'paid');
    const finalTxnId = transactionId || (chosenPayment !== 'cod' ? 'TXN_' + Date.now() + '_' + Math.floor(Math.random() * 1000) : null);

    const newOrder = await Order.create({
      id: 'order_' + Date.now(),
      userId: req.user.id,
      items: orderItems,
      subtotal,
      discount: finalDiscount,
      couponCode: couponCode || null,
      total: finalTotal, // delivery is free
      shipping,
      payment: chosenPayment,
      paymentStatus: finalPaymentStatus,
      transactionId: finalTxnId,
      status: 'pending',
      createdAt: new Date(),
    });

    // Clear user's saved cart in database
    await Cart.findOneAndUpdate({ userId: req.user.id }, { items: [] });

    // Send order confirmation email asynchronously
    User.findOne({ id: req.user.id }).lean().then(user => {
      sendOrderConfirmationEmail({ order: newOrder, user });
    }).catch(err => console.error('Error fetching user for order email:', err));

    res.status(201).json({ order: cleanOrder(newOrder) });
  } catch (err) {
    console.error('Create order error:', err);
    res.status(500).json({ message: 'Server error placing order.' });
  }
});

// GET /api/orders — own orders for a user; ALL orders for an admin
router.get('/', requireAuth, async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { userId: req.user.id };
    const orders = await Order.find(query).sort({ createdAt: -1 }).lean();

    res.json({ orders: orders.map(cleanOrder) });
  } catch (err) {
    console.error('Fetch orders error:', err);
    res.status(500).json({ message: 'Server error fetching orders.' });
  }
});

// PUT /api/orders/:id/cancel — user only (if pending or processing)
router.put('/:id/cancel', requireAuth, async (req, res) => {
  try {
    const order = await Order.findOne({ id: req.params.id, userId: req.user.id });
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    if (order.status !== 'pending' && order.status !== 'processing') {
      return res.status(400).json({ message: 'Only pending or processing orders can be cancelled.' });
    }

    order.status = 'cancelled';
    await order.save();

    // Send status update email asynchronously
    User.findOne({ id: order.userId }).lean().then(user => {
      sendOrderStatusEmail({ order, user, status: 'cancelled' });
    }).catch(err => console.error('Error fetching user for cancel email:', err));

    res.json({ message: 'Order cancelled successfully.', order: cleanOrder(order) });
  } catch (err) {
    console.error('Cancel order error:', err);
    res.status(500).json({ message: 'Server error cancelling order.' });
  }
});

// PUT /api/orders/:id/return — user only (if delivered, simulate 7 days policy)
router.put('/:id/return', requireAuth, async (req, res) => {
  try {
    const order = await Order.findOne({ id: req.params.id, userId: req.user.id });
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    if (order.status !== 'delivered') {
      return res.status(400).json({ message: 'Only delivered orders can be returned.' });
    }

    order.status = 'return_requested';
    await order.save();

    // Send status update email asynchronously
    User.findOne({ id: order.userId }).lean().then(user => {
      sendOrderStatusEmail({ order, user, status: 'return_requested' });
    }).catch(err => console.error('Error fetching user for return email:', err));

    res.json({ message: 'Return initiated successfully. Refund will be processed soon.', order: cleanOrder(order) });
  } catch (err) {
    console.error('Return order error:', err);
    res.status(500).json({ message: 'Server error initiating return.' });
  }
});

// PUT /api/orders/:id/status — admin only
const VALID_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'return_requested', 'refunded'];

router.put('/:id/status', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${VALID_STATUSES.join(', ')}.` });
    }

    const order = await Order.findOne({ id: req.params.id });
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    order.status = status;
    await order.save();

    // Send status email notification to customer
    User.findOne({ id: order.userId }).lean().then(user => {
      sendOrderStatusEmail({ order, user, status });
    }).catch(err => console.error('Error fetching user for status email:', err));

    res.json({ order: cleanOrder(order) });
  } catch (err) {
    console.error('Update order status error:', err);
    res.status(500).json({ message: 'Server error updating order status.' });
  }
});

module.exports = router;
