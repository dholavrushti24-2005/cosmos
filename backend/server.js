// backend/server.js
// Cosmos backend entry point with MongoDB connection.
// Serves the two static frontends (user + admin) and mounts API routes.

const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { PORT } = require('./config');
const connectDB = require('./db');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ---------- Static frontends & redirects ----------
app.use('/assets', express.static(path.join(__dirname, '..', 'assets')));
app.get(['/admin', '/admin/'], (req, res) => res.redirect('/admin/login.html'));
app.use('/admin', express.static(path.join(__dirname, '..', 'frontend', 'admin')));
app.use('/', express.static(path.join(__dirname, '..', 'frontend', 'user')));

// ---------- API readiness & routes ----------
// Ensure MongoDB connection is alive before processing API queries (prevents 10s buffer timeout)
app.use('/api', async (req, res, next) => {
  if (req.path === '/health') return next();

  if (mongoose.connection.readyState !== 1) {
    try {
      await connectDB();
    } catch (err) {
      return res.status(503).json({
        message: 'Database is reconnecting. Please wait 3-5 seconds and try again.'
      });
    }
  }
  next();
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/brands', require('./routes/brands'));
app.use('/api/users', require('./routes/users'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/reviews', require('./routes/reviews'));

// ---------- Health check & diagnostics ----------
app.get('/api/health', async (req, res) => {
  const isMongoReady = mongoose.connection.readyState === 1;
  let outboundIp = 'unknown';
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const ipRes = await fetch('https://api.ipify.org?format=json', { signal: controller.signal });
    clearTimeout(timeout);
    const ipData = await ipRes.json();
    outboundIp = ipData.ip;
  } catch (e) {
    outboundIp = 'Detection skipped: ' + e.message;
  }

  const rawUri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.DATABASE_URL || '';
  let targetHost = 'local';
  if (rawUri.includes('@')) {
    targetHost = rawUri.split('@')[1].split('?')[0];
  }

  res.json({
    status: 'ok',
    database: isMongoReady ? 'connected' : 'connecting',
    readyState: mongoose.connection.readyState,
    renderOutboundIp: outboundIp,
    mongoTargetHost: targetHost,
    lastMongoError: global.lastMongoError || null,
    message: isMongoReady ? 'Cosmos backend running with MongoDB' : 'Cosmos backend running, establishing MongoDB connection...'
  });
});

// ---------- Global error handling ----------
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error'
  });
});

async function autoSeedIfEmpty() {
  if (mongoose.connection.readyState !== 1) {
    return;
  }
  try {
    const Admin = require('./models/Admin');
    const Product = require('./models/Product');
    const Brand = require('./models/Brand');

    const adminCount = await Admin.countDocuments();
    const productCount = await Product.countDocuments();

    if (adminCount === 0 || productCount === 0) {
      console.log('Database empty or uninitialized. Checking database.json for initial seed...');
      const dbPath = path.join(__dirname, 'data', 'database.json');
      if (fs.existsSync(dbPath)) {
        const raw = fs.readFileSync(dbPath, 'utf-8');
        const data = JSON.parse(raw);

        if (adminCount === 0 && Array.isArray(data.admins) && data.admins.length > 0) {
          await Admin.insertMany(data.admins);
          console.log(`✓ Auto-seeded ${data.admins.length} admins`);
        }
        if (productCount === 0 && Array.isArray(data.products) && data.products.length > 0) {
          const brandCount = await Brand.countDocuments();
          if (brandCount === 0 && Array.isArray(data.brands) && data.brands.length > 0) {
            await Brand.insertMany(data.brands);
            console.log(`✓ Auto-seeded ${data.brands.length} brands`);
          }
          await Product.insertMany(data.products);
          console.log(`✓ Auto-seeded ${data.products.length} products`);
        }
      }
    }
  } catch (err) {
    console.warn('Auto-seed notice:', err.message);
  }
}

async function startServer() {
  // 1. Start HTTP server FIRST so Render port binding succeeds immediately!
  app.listen(PORT, () => {
    console.log(`Cosmos server running at http://localhost:${PORT}`);
    console.log(`  User site:  http://localhost:${PORT}/`);
    console.log(`  Admin site: http://localhost:${PORT}/admin/login.html`);
  });

  // 2. Connect to MongoDB with auto-retry
  try {
    await connectDB();
    await autoSeedIfEmpty();
  } catch (err) {
    console.warn('Initial MongoDB connection attempt deferred. Retrying in background...');
    let retrying = false;
    const retryInterval = setInterval(async () => {
      if (mongoose.connection.readyState === 1) {
        clearInterval(retryInterval);
        await autoSeedIfEmpty();
        return;
      }
      if (retrying) return;
      retrying = true;
      try {
        await connectDB();
        await autoSeedIfEmpty();
        clearInterval(retryInterval);
      } catch (retryErr) {
        // Will keep retrying in background
      } finally {
        retrying = false;
      }
    }, 10000);
  }
}

startServer();

