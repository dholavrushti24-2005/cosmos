// backend/routes/cart.js
// Persists a logged-in user's cart server-side (so it survives across
// devices/sessions). Guests use localStorage only (see frontend js/cart.js).

const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const { requireAuth } = require('../middleware/auth');

// GET /api/cart — returns the logged-in user's saved cart
router.get('/', requireAuth, async (req, res) => {
  try {
    const userCart = await Cart.findOne({ userId: req.user.id }).lean();
    res.json({ cart: userCart ? userCart.items : [] });
  } catch (err) {
    console.error('Fetch cart error:', err);
    res.status(500).json({ message: 'Server error fetching cart.' });
  }
});

// PUT /api/cart — replaces the logged-in user's saved cart
router.put('/', requireAuth, async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ message: 'items must be an array.' });
    }

    const cart = await Cart.findOneAndUpdate(
      { userId: req.user.id },
      { items },
      { new: true, upsert: true }
    ).lean();

    res.json({ cart: cart.items });
  } catch (err) {
    console.error('Update cart error:', err);
    res.status(500).json({ message: 'Server error updating cart.' });
  }
});

module.exports = router;
