// backend/routes/brands.js
// Public brand listing + single brand lookup, plus admin-only
// create/update/delete.

const express = require('express');
const router = express.Router();
const Brand = require('../models/Brand');
const Product = require('../models/Product');
const { requireAuth, requireAdmin } = require('../middleware/auth');

function cleanBrand(b) {
  if (!b) return null;
  const obj = b.toObject ? b.toObject() : { ...b };
  delete obj._id;
  delete obj.__v;
  return obj;
}

// GET /api/brands
router.get('/', async (req, res) => {
  try {
    const brands = await Brand.find({}).lean();
    res.json({ brands: brands.map(cleanBrand) });
  } catch (err) {
    console.error('Fetch brands error:', err);
    res.status(500).json({ message: 'Server error fetching brands.' });
  }
});

// GET /api/brands/:id
router.get('/:id', async (req, res) => {
  try {
    const brand = await Brand.findOne({ id: req.params.id }).lean();
    if (!brand) return res.status(404).json({ message: 'Brand not found.' });
    res.json({ brand: cleanBrand(brand) });
  } catch (err) {
    console.error('Fetch brand error:', err);
    res.status(500).json({ message: 'Server error fetching brand.' });
  }
});

// POST /api/brands — admin only
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { name, description, logo, category } = req.body;

    if (!name || !description || !category) {
      return res.status(400).json({ message: 'Name, description and category are required.' });
    }

    const newBrand = await Brand.create({
      id: 'brand_' + Date.now(),
      name,
      description,
      logo: logo || '',
      category,
    });

    res.status(201).json({ brand: cleanBrand(newBrand) });
  } catch (err) {
    console.error('Create brand error:', err);
    res.status(500).json({ message: 'Server error creating brand.' });
  }
});

// PUT /api/brands/:id — admin only
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const brand = await Brand.findOne({ id: req.params.id });
    if (!brand) return res.status(404).json({ message: 'Brand not found.' });

    const { name, description, logo, category } = req.body;
    if (name !== undefined) brand.name = name;
    if (description !== undefined) brand.description = description;
    if (logo !== undefined) brand.logo = logo;
    if (category !== undefined) brand.category = category;

    await brand.save();
    res.json({ brand: cleanBrand(brand) });
  } catch (err) {
    console.error('Update brand error:', err);
    res.status(500).json({ message: 'Server error updating brand.' });
  }
});

// DELETE /api/brands/:id — admin only
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const brand = await Brand.findOne({ id: req.params.id });
    if (!brand) return res.status(404).json({ message: 'Brand not found.' });

    // Guard: don't silently orphan products still linked to this brand
    const inUse = await Product.exists({ brandId: req.params.id });
    if (inUse) {
      return res.status(409).json({ message: 'Cannot delete a brand that still has products. Reassign or delete those products first.' });
    }

    await Brand.deleteOne({ id: req.params.id });
    res.json({ message: 'Brand deleted.' });
  } catch (err) {
    console.error('Delete brand error:', err);
    res.status(500).json({ message: 'Server error deleting brand.' });
  }
});

module.exports = router;
