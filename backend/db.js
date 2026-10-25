// backend/db.js
// MongoDB connection using Mongoose

const dns = require('dns');
const mongoose = require('mongoose');
const { MONGODB_URI } = require('./config');

// Configure DNS for MongoDB Atlas SRV resolution
try {
  if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
  }
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  // ignore
}

// Dynamically converts any MongoDB Atlas SRV URI into a direct replica-set URI
// to bypass cloud SRV/DNS issues if they occur.
async function resolveSrvToStandardUri(srvUri) {
  if (!srvUri || typeof srvUri !== 'string' || !srvUri.startsWith('mongodb+srv://')) return null;
  try {
    const match = srvUri.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@([^/?]+)\/?([^?]*)/);
    if (!match) return null;
    const [, user, pass, host, db] = match;
    const addresses = await dns.promises.resolveSrv(`_mongodb._tcp.${host}`);
    if (!addresses || addresses.length === 0) return null;
    const hostList = addresses.map(a => `${a.name}:${a.port}`).join(',');

    let extraParams = 'ssl=true&authSource=admin&retryWrites=true&w=majority';
    try {
      const txt = await dns.promises.resolveTxt(host);
      if (txt && txt[0] && txt[0][0]) {
        extraParams = `ssl=true&${txt[0][0]}&retryWrites=true&w=majority`;
      }
    } catch (_) {}

    const dbName = db || 'cosmos';
    return `mongodb://${user}:${pass}@${hostList}/${dbName}?${extraParams}`;
  } catch (err) {
    return null;
  }
}

let isConnecting = false;
let listenersAttached = false;

function attachConnectionListeners() {
  if (listenersAttached) return;
  listenersAttached = true;

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ MongoDB connection dropped! Scheduling automatic reconnect in 3s...');
    setTimeout(() => {
      connectDB().catch(err => {
        console.error('Auto-reconnect attempt failed:', err.message);
      });
    }, 3000);
  });

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB runtime connection error:', err.message);
    global.lastMongoError = err.message;
  });

  mongoose.connection.on('reconnected', () => {
    console.log('✓ MongoDB reconnected successfully');
    global.lastMongoError = null;
  });
}

const MONGO_OPTIONS = {
  serverSelectionTimeoutMS: 8000,
  socketTimeoutMS: 45000,
  heartbeatFrequencyMS: 10000, // Send keep-alive ping every 10s so Atlas doesn't close idle sockets
  maxPoolSize: 10,
  minPoolSize: 1,
};

async function connectDB() {
  attachConnectionListeners();

  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (isConnecting || mongoose.connection.readyState === 2) return;

  isConnecting = true;
  try {
    let conn;
    try {
      conn = await mongoose.connect(MONGODB_URI, MONGO_OPTIONS);
    } catch (srvErr) {
      const fallbackUri = await resolveSrvToStandardUri(MONGODB_URI);
      if (fallbackUri && fallbackUri !== MONGODB_URI) {
        console.warn('SRV connection attempt timed out or failed. Retrying with direct replica-set standard connection...');
        try {
          conn = await mongoose.connect(fallbackUri, MONGO_OPTIONS);
        } catch (fbErr) {
          console.warn('Direct connection fallback attempt with family:4...');
          conn = await mongoose.connect(fallbackUri, {
            ...MONGO_OPTIONS,
            family: 4,
          });
        }
      } else {
        throw srvErr;
      }
    }

    const host = conn.connection.host || 'Atlas Cluster';
    const dbName = conn.connection.name || 'cosmos';
    console.log(`✓ Connected to MongoDB: ${host}/${dbName}`);
    global.lastMongoError = null;
    return conn;
  } catch (error) {
    global.lastMongoError = error.message;
    console.error('MongoDB connection error:', error.message);
    throw error;
  } finally {
    isConnecting = false;
  }
}

module.exports = connectDB;

