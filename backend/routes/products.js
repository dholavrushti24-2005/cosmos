// backend/routes/products.js
// Public product listing + single product lookup, plus admin-only
// create/update/delete.

const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { ProductReview } = require('../models/Review');
const { requireAuth, requireAdmin } = require('../middleware/auth');

function cleanProduct(p) {
  if (!p) return null;
  const obj = p.toObject ? p.toObject() : { ...p };
  delete obj._id;
  delete obj.__v;
  return obj;
}

function attachRatingStats(p, reviewMap) {
  const clean = cleanProduct(p);
  const stats = reviewMap && reviewMap[p.id];
  if (stats && stats.count > 0) {
    clean.rating = Number((stats.sum / stats.count).toFixed(1));
    clean.reviewCount = stats.count;
  } else {
    clean.rating = 0;
    clean.reviewCount = 0;
  }
  return clean;
}

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const { category, search, brandId } = req.query;
    const filter = {};

    if (category) {
      filter.category = category;
    }
    if (brandId) {
      filter.brandId = brandId;
    }
    if (search) {
      const q = search.trim();
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
      ];
    }

    const [products, reviews] = await Promise.all([
      Product.find(filter).lean(),
      ProductReview.find({}).lean(),
    ]);

    const reviewMap = {};
    for (const r of reviews) {
      if (!reviewMap[r.productId]) {
        reviewMap[r.productId] = { sum: 0, count: 0 };
      }
      reviewMap[r.productId].sum += r.rating;
      reviewMap[r.productId].count += 1;
    }

    res.json({
      products: products.map(p => attachRatingStats(p, reviewMap))
    });
  } catch (err) {
    console.error('Fetch products error:', err);
    res.status(500).json({ message: 'Server error fetching products.' });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const [product, reviews] = await Promise.all([
      Product.findOne({ id: req.params.id }).lean(),
      ProductReview.find({ productId: req.params.id }).lean(),
    ]);

    if (!product) return res.status(404).json({ message: 'Product not found.' });

    const reviewMap = {};
    if (reviews.length > 0) {
      const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
      reviewMap[product.id] = { sum, count: reviews.length };
    }

    res.json({ product: attachRatingStats(product, reviewMap) });
  } catch (err) {
    console.error('Fetch product error:', err);
    res.status(500).json({ message: 'Server error fetching product.' });
  }
});

// POST /api/products — admin only
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, description, price, originalPrice, category, subCategory, brandId, image, images, videos, badge, stock, sizes } = req.body;

    if (!name || !description || price === undefined || !category) {
      return res.status(400).json({ message: 'Name, description, price, and category are required.' });
    }

    const imagesList = Array.isArray(images) ? images : (image ? [image] : []);
    const primaryImage = imagesList.length > 0 ? imagesList[0] : (image || '');
    const videosList = Array.isArray(videos) ? videos : [];

    let sizesList = [];
    if (Array.isArray(sizes)) {
      sizesList = sizes.map(s => String(s).trim()).filter(Boolean);
    } else if (typeof sizes === 'string') {
      sizesList = sizes.split(',').map(s => s.trim()).filter(Boolean);
    }

    const newProduct = await Product.create({
      id: 'prod_' + Date.now(),
      name,
      description,
      price: Number(price),
      originalPrice: originalPrice ? Number(originalPrice) : null,
      category,
      subCategory: subCategory || null,
      brandId: brandId || null,
      image: primaryImage,
      images: imagesList,
      videos: videosList,
      badge: badge || null,
      stock: stock !== undefined ? Number(stock) : 0,
      sizes: sizesList,
      createdAt: new Date(),
    });

    res.status(201).json({ product: cleanProduct(newProduct) });
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ message: 'Server error creating product.' });
  }
});

// PUT /api/products/:id — admin only
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const product = await Product.findOne({ id: req.params.id });
    if (!product) return res.status(404).json({ message: 'Product not found.' });

    const { name, description, price, originalPrice, category, subCategory, brandId, image, images, videos, badge, stock, sizes } = req.body;
    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = Number(price);
    if (originalPrice !== undefined) product.originalPrice = originalPrice ? Number(originalPrice) : null;
    if (category !== undefined) product.category = category;
    if (subCategory !== undefined) product.subCategory = subCategory;
    if (brandId !== undefined) product.brandId = brandId;
    if (badge !== undefined) product.badge = badge || null;
    if (stock !== undefined) product.stock = Number(stock);

    if (sizes !== undefined) {
      if (Array.isArray(sizes)) {
        product.sizes = sizes.map(s => String(s).trim()).filter(Boolean);
      } else if (typeof sizes === 'string') {
        product.sizes = sizes.split(',').map(s => s.trim()).filter(Boolean);
      } else {
        product.sizes = [];
      }
    }

    if (images !== undefined) {
      product.images = Array.isArray(images) ? images : [];
      if (product.images.length > 0) {
        product.image = product.images[0];
      } else if (image !== undefined) {
        product.image = image;
      }
    } else if (image !== undefined) {
      product.image = image;
      if (!product.images || product.images.length === 0) {
        product.images = image ? [image] : [];
      }
    }

    if (videos !== undefined) {
      product.videos = Array.isArray(videos) ? videos : [];
    } else if (!product.videos) {
      product.videos = [];
    }

    await product.save();
    res.json({ product: cleanProduct(product) });
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ message: 'Server error updating product.' });
  }
});

// DELETE /api/products/:id — admin only
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await Product.deleteOne({ id: req.params.id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }
    res.json({ message: 'Product deleted.' });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ message: 'Server error deleting product.' });
  }
});

module.exports = router;
