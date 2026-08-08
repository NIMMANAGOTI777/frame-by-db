const mongoose = require('mongoose');

function isAtlasURI(uri) {
  if (!uri) return false;
  if (uri.includes('localhost') || uri.includes('127.0.0.1') || uri.includes('[::1]')) {
    return false;
  }
  return uri.startsWith('mongodb+srv://') || uri.includes('.mongodb.net');
}

function getSanitizedHost(uri) {
  try {
    const match = uri.match(/@([^/?#]+)/);
    if (match && match[1]) {
      return match[1];
    }
    const withoutProtocol = uri.replace(/^mongodb(\+srv)?:\/\//, '');
    const slashIdx = withoutProtocol.indexOf('/');
    const hostPart = slashIdx !== -1 ? withoutProtocol.substring(0, slashIdx) : withoutProtocol;
    return hostPart.split('@').pop() || 'unknown-host';
  } catch (e) {
    return 'unknown-host';
  }
}

async function connectDB() {
  const connStr = process.env.MONGODB_URI;

  if (!connStr) {
    console.error('[DATABASE] MONGODB_URI is missing');
    return;
  }

  if (!isAtlasURI(connStr)) {
    console.warn('[DATABASE] MONGODB_URI is not a valid MongoDB Atlas connection string.');
  }

  const host = getSanitizedHost(connStr);
  try {
    console.log(`[DATABASE] Connecting to MongoDB cluster: ${host}...`);
    const conn = await mongoose.connect(connStr);
    console.log(`[DATABASE] MongoDB connected successfully: ${host}`);
    return conn;
  } catch (error) {
    console.error(`[DATABASE] MongoDB connection failed [${host}]: ${error.message}`);
  }
}

module.exports = connectDB;
