// backend/routes/users.js
// "Me" endpoints for the logged-in user (profile view/update), plus
// admin user management.

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { requireAuth, requireAdmin } = require('../middleware/auth');

function publicUser(user) {
  if (!user) return null;
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.passwordHash;
  delete obj._id;
  delete obj.__v;
  return obj;
}

// GET /api/users — admin only, basic list
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 }).lean();
    res.json({ users: users.map(publicUser) });
  } catch (err) {
    console.error('Fetch users error:', err);
    res.status(500).json({ message: 'Server error fetching users.' });
  }
});

// GET /api/users/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'user') {
      return res.status(403).json({ message: 'Not a user account.' });
    }

    const user = await User.findOne({ id: req.user.id });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    res.json({ user: publicUser(user) });
  } catch (err) {
    console.error('Fetch me error:', err);
    res.status(500).json({ message: 'Server error fetching profile.' });
  }
});

// PUT /api/users/me
router.put('/me', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'user') {
      return res.status(403).json({ message: 'Not a user account.' });
    }

    const { name, phone, address, pincode, city } = req.body;
    const user = await User.findOne({ id: req.user.id });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (pincode !== undefined) user.pincode = pincode;
    if (city !== undefined) user.city = city;

    await user.save();
    res.json({ user: publicUser(user) });
  } catch (err) {
    console.error('Update me error:', err);
    res.status(500).json({ message: 'Server error updating profile.' });
  }
});

// PUT /api/users/:id/status — admin only, toggle active/blocked
router.put('/:id/status', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'blocked'].includes(status)) {
      return res.status(400).json({ message: 'Status must be "active" or "blocked".' });
    }

    const user = await User.findOne({ id: req.params.id });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    user.status = status;
    await user.save();
    res.json({ user: publicUser(user) });
  } catch (err) {
    console.error('Update user status error:', err);
    res.status(500).json({ message: 'Server error updating user status.' });
  }
});

// DELETE /api/users/:id — admin only
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const result = await User.deleteOne({ id: req.params.id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json({ message: 'User deleted.' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ message: 'Server error deleting user.' });
  }
});

module.exports = router;
