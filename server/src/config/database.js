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
    console.error('CRITICAL: MONGODB_URI environment variable is not defined.');
    process.exit(1);
  }

  if (!isAtlasURI(connStr)) {
    console.error('CRITICAL: MONGODB_URI is not a valid MongoDB Atlas connection string.');
    console.error('It must be an Atlas URI (e.g. starting with mongodb+srv:// and pointing to a *.mongodb.net cluster).');
    process.exit(1);
  }

  const host = getSanitizedHost(connStr);
  try {
    console.log(`Connecting to MongoDB Atlas cluster: ${host}...`);
    const conn = await mongoose.connect(connStr);
    console.log(`MongoDB Connected successfully to Atlas cluster: ${host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error for host [${host}]: ${error.message}`);
    process.exit(1);
  }
}

module.exports = connectDB;
