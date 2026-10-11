// backend/server.js
// Cosmos backend entry point with MongoDB connection.
// Serves the two static frontends (user + admin) and mounts API routes.

const path = require('path');
const express = require('express');
const cors = require('cors');
const { PORT } = require('./config');
const connectDB = require('./db');

const app = express();

app.use(cors());
app.use(express.json());

// ---------- Static frontends ----------
app.use('/assets', express.static(path.join(__dirname, '..', 'assets')));
app.use('/admin', express.static(path.join(__dirname, '..', 'frontend', 'admin')));
app.use('/', express.static(path.join(__dirname, '..', 'frontend', 'user')));

// ---------- API routes ----------
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/brands', require('./routes/brands'));
app.use('/api/users', require('./routes/users'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/reviews', require('./routes/reviews'));

// ---------- Health check ----------
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Cosmos backend running with MongoDB' });
});

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Cosmos server running at http://localhost:${PORT}`);
      console.log(`  User site:  http://localhost:${PORT}/`);
      console.log(`  Admin site: http://localhost:${PORT}/admin/login.html`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
