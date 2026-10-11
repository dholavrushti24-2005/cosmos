// backend/routes/reviews.js
// Handles product reviews and general site reviews.

const express = require('express');
const router = express.Router();
const { ProductReview, SiteReview } = require('../models/Review');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

function cleanReview(r) {
  if (!r) return null;
  const obj = r.toObject ? r.toObject() : { ...r };
  delete obj._id;
  delete obj.__v;
  return obj;
}

// GET /api/reviews/product/:id - Get reviews for a product
router.get('/product/:id', async (req, res) => {
  try {
    const reviews = await ProductReview.find({ productId: req.params.id }).sort({ createdAt: -1 }).lean();
    res.json({ reviews: reviews.map(cleanReview) });
  } catch (err) {
    console.error('Fetch product reviews error:', err);
    res.status(500).json({ message: 'Server error fetching product reviews.' });
  }
});

// POST /api/reviews/product/:id - Submit a product review
router.post('/product/:id', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'user') {
      return res.status(403).json({ message: 'Only users can submit reviews.' });
    }

    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
    }

    const user = await User.findOne({ id: req.user.id }).lean();
    const userName = (user && user.name) || req.user.name || 'Anonymous User';

    const review = await ProductReview.create({
      id: `prev_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      productId: req.params.id,
      userId: req.user.id,
      userName,
      rating: Number(rating),
      comment: comment || '',
      createdAt: new Date(),
    });

    res.status(201).json({ message: 'Review submitted successfully', review: cleanReview(review) });
  } catch (err) {
    console.error('Submit product review error:', err);
    res.status(500).json({ message: 'Server error submitting product review.' });
  }
});

// GET /api/reviews/site - Get site reviews
router.get('/site', async (req, res) => {
  try {
    const reviews = await SiteReview.find({}).sort({ createdAt: -1 }).lean();
    res.json({ reviews: reviews.map(cleanReview) });
  } catch (err) {
    console.error('Fetch site reviews error:', err);
    res.status(500).json({ message: 'Server error fetching site reviews.' });
  }
});

// POST /api/reviews/site - Submit a site review
router.post('/site', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'user') {
      return res.status(403).json({ message: 'Only users can submit site reviews.' });
    }

    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
    }

    const user = await User.findOne({ id: req.user.id }).lean();
    const userName = (user && user.name) || req.user.name || 'Anonymous User';

    const review = await SiteReview.create({
      id: `srev_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      userId: req.user.id,
      userName,
      rating: Number(rating),
      comment: comment || '',
      createdAt: new Date(),
    });

    res.status(201).json({ message: 'Site review submitted successfully', review: cleanReview(review) });
  } catch (err) {
    console.error('Submit site review error:', err);
    res.status(500).json({ message: 'Server error submitting site review.' });
  }
});

module.exports = router;
