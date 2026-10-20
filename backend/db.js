// backend/db.js
// MongoDB connection using Mongoose

const dns = require('dns');
const mongoose = require('mongoose');
const { MONGODB_URI } = require('./config');

// Use Google Public DNS only on local Windows (fixes Jio/Reliance ISP SRV DNS issues locally).
// Do NOT override DNS on Render / Cloud Linux containers as container internal DNS is required.
if (!process.env.RENDER && process.platform === 'win32') {
  try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
  } catch (e) {
    // ignore
  }
}

let isConnecting = false;

async function connectDB() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (isConnecting || mongoose.connection.readyState === 2) return;

  isConnecting = true;
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      family: 4, // Force IPv4 to prevent Node 24 IPv6 lookup timeouts on Render/cloud
    });
    const host = conn.connection.host || 'Atlas Cluster';
    const dbName = conn.connection.name || 'cosmos';
    console.log(`✓ Connected to MongoDB: ${host}/${dbName}`);
    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    throw error;
  } finally {
    isConnecting = false;
  }
}

module.exports = connectDB;

