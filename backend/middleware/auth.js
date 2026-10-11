// backend/middleware/auth.js
// JWT verification middleware, shared by user and admin protected routes.

const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

// Verifies the token and attaches { id, role } to req.user.
// Use on any route that requires the caller to be logged in.
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'No token provided. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, role }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired session. Please log in again.' });
  }
}

// Use after requireAuth on routes that only admins may access.
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required.' });
  }
  next();
}

module.exports = { requireAuth, requireAdmin };
