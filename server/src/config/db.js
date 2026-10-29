import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export let isMongoConnected = false;
let hasAttemptedConnect = false;

/**
 * Connect to MongoDB with fallback to persistent JSON storage if offline.
 * Bypasses placeholder dummy URIs to eliminate startup delays.
 */
export async function connectDB(mongoUri) {
  if (isMongoConnected || hasAttemptedConnect) {
    return;
  }
  hasAttemptedConnect = true;

  if (!mongoUri || mongoUri.includes('cluster0.mongodb.net') || mongoUri.includes('AdminPass123')) {
    console.log('[DB] Using local persistent storage engine in server/data (offline-ready & instant).');
    isMongoConnected = false;
    return;
  }

  try {
    console.log(`[DB] Attempting connection to MongoDB (${mongoUri.replace(/:([^:@]{4})[^:@]*@/, ':****@')})...`);
    mongoose.set('strictQuery', false);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000
    });
    isMongoConnected = true;
    console.log('[DB] Successfully connected to MongoDB.');
  } catch (err) {
    console.warn(`[DB] Could not connect to external MongoDB: ${err.message}`);
    console.log('[DB] Switched to persistent local storage engine in server/data.');
    isMongoConnected = false;
  }
}
