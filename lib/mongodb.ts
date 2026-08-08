import mongoose from 'mongoose';

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development and serverless execution in production.
 */
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

const DEFAULT_MONGODB_URI = "mongodb+srv://karthiknimmanagoti475_db_user:BPkauUOdNA6xJFXH@frame-by-db.vdgpklf.mongodb.net/framebydb?retryWrites=true&w=majority";

export async function connectToDatabase() {
  const uri = process.env.MONGODB_URI || DEFAULT_MONGODB_URI;

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(uri, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}
