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

let isConnected = false;

async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) return;
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      family: 4, // Force IPv4 to prevent Node 24 IPv6 lookup timeouts on Render/cloud
    });
    isConnected = true;
    console.log(`Connected to MongoDB: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    isConnected = false;
    console.error('MongoDB connection error:', error.message);
    throw error;
  }
}

module.exports = connectDB;

