// backend/routes/auth.js
// Authentication for user and admin, including Registration OTP verification and Forgot Password OTP.

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();

const User = require('../models/User');
const Admin = require('../models/Admin');
const Otp = require('../models/Otp');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config');
const { requireAuth } = require('../middleware/auth');
const { sendWelcomeEmail, sendOtpEmail } = require('../utils/mailer');

function signUserToken(user) {
  return jwt.sign({ id: user.id, role: 'user' }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function signAdminToken(admin) {
  return jwt.sign({ id: admin.id, role: 'admin' }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function publicUser(user) {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.passwordHash;
  delete obj.resetPasswordOtp;
  delete obj.resetPasswordExpires;
  delete obj._id;
  delete obj.__v;
  return obj;
}

function publicAdmin(admin) {
  const obj = admin.toObject ? admin.toObject() : { ...admin };
  delete obj.passwordHash;
  delete obj.resetPasswordOtp;
  delete obj.resetPasswordExpires;
  delete obj._id;
  delete obj.__v;
  return obj;
}

// 1. POST /api/auth/send-register-otp — Sends a 6-digit OTP before account creation
router.post('/send-register-otp', async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email address is required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists. Please log in.' });
    }

    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Replace any existing registration OTP for this email
    await Otp.deleteMany({ email: cleanEmail, purpose: 'register' });
    await Otp.create({
      email: cleanEmail,
      otp,
      purpose: 'register',
    });

    // Send email from moradiyazeel5@gmail.com
    sendOtpEmail({
      email: cleanEmail,
      name: name || 'Valued User',
      otp,
      purpose: 'register',
    });

    res.json({ message: 'Verification OTP sent to your email.' });
  } catch (err) {
    console.error('Send register OTP error:', err);
    res.status(500).json({ message: 'Error sending verification OTP.' });
  }
});

// 2. POST /api/auth/verify-register-otp — Verifies OTP and completes registration
router.post('/verify-register-otp', async (req, res) => {
  try {
    const { name, email, password, phone, otp } = req.body;

    if (!name || !email || !password || !otp) {
      return res.status(400).json({ message: 'Name, email, password, and OTP code are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Verify OTP
    const record = await Otp.findOne({ email: cleanEmail, otp: otp.trim(), purpose: 'register' });
    if (!record) {
      return res.status(400).json({ message: 'Invalid or expired OTP code. Please check your email.' });
    }

    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({ message: 'Account already exists. Please log in.' });
    }

    const newUser = await User.create({
      id: 'user_' + Date.now(),
      name,
      email: cleanEmail,
      passwordHash: bcrypt.hashSync(password, 10),
      phone: phone || '',
      address: '',
      wishlist: [],
      status: 'active',
      createdAt: new Date(),
    });

    // Delete used OTP
    await Otp.deleteMany({ email: cleanEmail, purpose: 'register' });

    // Send welcome email
    sendWelcomeEmail({ email: cleanEmail, name: newUser.name });

    const token = signUserToken(newUser);
    res.status(201).json({ token, user: publicUser(newUser) });
  } catch (err) {
    console.error('Verify register OTP error:', err);
    res.status(500).json({ message: 'Server error verifying OTP.' });
  }
});

// 3. POST /api/auth/register (Direct register fallback)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const newUser = await User.create({
      id: 'user_' + Date.now(),
      name,
      email: cleanEmail,
      passwordHash: bcrypt.hashSync(password, 10),
      phone: phone || '',
      address: '',
      wishlist: [],
      status: 'active',
      createdAt: new Date(),
    });

    const token = signUserToken(newUser);
    sendWelcomeEmail({ email: cleanEmail, name: newUser.name });

    res.status(201).json({ token, user: publicUser(newUser) });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

// 4. POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (user.status === 'blocked') {
      return res.status(403).json({ message: 'Your account has been blocked. Please contact support.' });
    }

    const token = signUserToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

// 5. GET /api/auth/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'user') {
      return res.status(403).json({ message: 'Not a user account.' });
    }

    const user = await User.findOne({ id: req.user.id });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    res.json({ user: publicUser(user) });
  } catch (err) {
    console.error('Auth me error:', err);
    res.status(500).json({ message: 'Server error fetching user profile.' });
  }
});

// 6. POST /api/auth/forgot-password — Sends 6-digit OTP for password reset (User & Admin)
router.post('/forgot-password', async (req, res) => {
  try {
    const { email, role } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email address is required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const isUser = role !== 'admin';
    const account = isUser
      ? await User.findOne({ email: cleanEmail })
      : await Admin.findOne({ email: cleanEmail });

    if (!account) {
      return res.status(404).json({ message: `No ${isUser ? 'user' : 'admin'} account found with this email address.` });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    account.resetPasswordOtp = otp;
    account.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await account.save();

    // Send email from moradiyazeel5@gmail.com
    sendOtpEmail({
      email: cleanEmail,
      name: account.name,
      otp,
      purpose: 'forgot_password',
    });

    res.json({ message: 'Password reset OTP has been sent to your email.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Error initiating password reset.' });
  }
});

// 7. POST /api/auth/reset-password — Verifies OTP and updates password (User & Admin)
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword, role } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP, and new password are required.' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const isUser = role !== 'admin';
    const account = isUser
      ? await User.findOne({ email: cleanEmail })
      : await Admin.findOne({ email: cleanEmail });

    if (!account) {
      return res.status(404).json({ message: 'Account not found.' });
    }

    if (!account.resetPasswordOtp || account.resetPasswordOtp !== otp.trim()) {
      return res.status(400).json({ message: 'Invalid OTP code. Please check your email and try again.' });
    }

    if (!account.resetPasswordExpires || new Date(account.resetPasswordExpires) < new Date()) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new code.' });
    }

    // Update password
    account.passwordHash = bcrypt.hashSync(newPassword, 10);
    account.resetPasswordOtp = null;
    account.resetPasswordExpires = null;
    await account.save();

    res.json({ message: 'Password reset successfully! You can now log in with your new password.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Server error resetting password.' });
  }
});

// ---------- Admin auth ----------

// POST /api/auth/admin-login
router.post('/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });

    if (!admin || !bcrypt.compareSync(password, admin.passwordHash)) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = signAdminToken(admin);
    res.json({ token, admin: publicAdmin(admin) });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ message: 'Server error during admin login.' });
  }
});

// GET /api/auth/admin-me
router.get('/admin-me', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required.' });
    }

    const admin = await Admin.findOne({ id: req.user.id });
    if (!admin) return res.status(404).json({ message: 'Admin not found.' });

    res.json({ admin: publicAdmin(admin) });
  } catch (err) {
    console.error('Admin me error:', err);
    res.status(500).json({ message: 'Server error fetching admin profile.' });
  }
});

module.exports = router;
