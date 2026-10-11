// backend/scripts/seed.js
// Migrates all data from backend/data/database.json into MongoDB

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const connectDB = require('../db');

const Admin = require('../models/Admin');
const User = require('../models/User');
const Brand = require('../models/Brand');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const { ProductReview, SiteReview } = require('../models/Review');

async function seed() {
  await connectDB();
  console.log('Starting migration from database.json to MongoDB...');

  const dbPath = path.join(__dirname, '..', 'data', 'database.json');
  if (!fs.existsSync(dbPath)) {
    console.error('database.json not found at:', dbPath);
    process.exit(1);
  }

  const raw = fs.readFileSync(dbPath, 'utf-8');
  const data = JSON.parse(raw);

  // Clear existing collections
  await Promise.all([
    Admin.deleteMany({}),
    User.deleteMany({}),
    Brand.deleteMany({}),
    Product.deleteMany({}),
    Cart.deleteMany({}),
    Order.deleteMany({}),
    ProductReview.deleteMany({}),
    SiteReview.deleteMany({}),
  ]);

  // Insert Admins
  if (Array.isArray(data.admins) && data.admins.length > 0) {
    await Admin.insertMany(data.admins);
    console.log(`✓ Inserted ${data.admins.length} admins`);
  }

  // Insert Users
  if (Array.isArray(data.users) && data.users.length > 0) {
    await User.insertMany(data.users);
    console.log(`✓ Inserted ${data.users.length} users`);
  }

  // Insert Brands
  if (Array.isArray(data.brands) && data.brands.length > 0) {
    await Brand.insertMany(data.brands);
    console.log(`✓ Inserted ${data.brands.length} brands`);
  }

  // Insert Products
  if (Array.isArray(data.products) && data.products.length > 0) {
    await Product.insertMany(data.products);
    console.log(`✓ Inserted ${data.products.length} products`);
  }

  // Insert Carts
  if (data.carts && typeof data.carts === 'object') {
    const cartEntries = Object.entries(data.carts).map(([userId, items]) => ({
      userId,
      items: Array.isArray(items) ? items : [],
    }));
    if (cartEntries.length > 0) {
      await Cart.insertMany(cartEntries);
      console.log(`✓ Inserted ${cartEntries.length} carts`);
    }
  }

  // Insert Orders
  if (Array.isArray(data.orders) && data.orders.length > 0) {
    await Order.insertMany(data.orders);
    console.log(`✓ Inserted ${data.orders.length} orders`);
  }

  // Insert Product Reviews
  if (Array.isArray(data.productReviews) && data.productReviews.length > 0) {
    await ProductReview.insertMany(data.productReviews);
    console.log(`✓ Inserted ${data.productReviews.length} product reviews`);
  }

  // Insert Site Reviews
  if (Array.isArray(data.siteReviews) && data.siteReviews.length > 0) {
    await SiteReview.insertMany(data.siteReviews);
    console.log(`✓ Inserted ${data.siteReviews.length} site reviews`);
  }

  console.log('✓ Migration to MongoDB completed successfully!');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
