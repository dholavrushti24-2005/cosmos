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

// Converts a MongoDB Atlas SRV URI for cluster0.shmq1yg.mongodb.net into a standard replica-set URI
// which bypasses DNS SRV lookups entirely and connects directly to the 3 shard hosts.
function getStandardReplicaSetUri(uri) {
  if (!uri || typeof uri !== 'string') return null;
  const match = uri.match(/mongodb\+srv:\/\/([^:]+):([^@]+)@cluster0\.shmq1yg\.mongodb\.net\/([^?]+)(.*)/);
  if (!match) return null;
  const [, user, pass, db] = match;
  return `mongodb://${user}:${pass}@ac-wfwxcxz-shard-00-00.shmq1yg.mongodb.net:27017,ac-wfwxcxz-shard-00-01.shmq1yg.mongodb.net:27017,ac-wfwxcxz-shard-00-02.shmq1yg.mongodb.net:27017/${db}?ssl=true&replicaSet=atlas-kitlz6-shard-0&authSource=admin&retryWrites=true&w=majority`;
}

let isConnecting = false;

async function connectDB() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (isConnecting || mongoose.connection.readyState === 2) return;

  isConnecting = true;
  try {
    let conn;
    try {
      conn = await mongoose.connect(MONGODB_URI, {
        serverSelectionTimeoutMS: 6000,
      });
    } catch (srvErr) {
      const fallbackUri = getStandardReplicaSetUri(MONGODB_URI);
      if (fallbackUri && fallbackUri !== MONGODB_URI) {
        console.warn('SRV connection attempt timed out or failed. Retrying with direct replica-set standard connection...');
        try {
          conn = await mongoose.connect(fallbackUri, {
            serverSelectionTimeoutMS: 8000,
          });
        } catch (fbErr) {
          console.warn('Direct connection fallback attempt with family:4...');
          conn = await mongoose.connect(fallbackUri, {
            serverSelectionTimeoutMS: 8000,
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

