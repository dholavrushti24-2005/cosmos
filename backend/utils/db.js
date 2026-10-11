// backend/utils/db.js
// Simple JSON-file "database" helpers. No ORM, no external DB —
// matches the reference project's approach and keeps things easy
// to explain in a college viva.

const fs = require('fs');
const { DB_PATH } = require('../config');

function readDB() {
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(raw);
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

module.exports = { readDB, writeDB };
