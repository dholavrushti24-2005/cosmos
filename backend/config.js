const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
require('dotenv').config({ path: path.join(__dirname, '.env') });

module.exports = {
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET || 'cosmos_dev_secret_change_me',
  JWT_EXPIRES_IN: '7d',
  DB_PATH: path.join(__dirname, 'data', 'database.json'),
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cosmos',
};

