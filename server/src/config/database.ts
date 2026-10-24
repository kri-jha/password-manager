import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let isConnected = false;

export async function connectDatabase(uri?: string): Promise<typeof mongoose> {
  const dbUri = uri || env.MONGODB_URI;

  if (!dbUri) {
    throw new Error('Database URI is not defined.');
  }

  // Redact credentials from URI for safe logging
  const safeUri = dbUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');

  mongoose.connection.on('connected', () => {
    isConnected = true;
    logger.info(`MongoDB connected successfully to ${safeUri}`);
  });

  mongoose.connection.on('error', (err) => {
    isConnected = false;
    logger.error('MongoDB connection error', err);
  });

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    logger.warn('MongoDB connection disconnected. Attempting reconnection...');
  });

  try {
    const conn = await mongoose.connect(dbUri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 8000
    });
    return conn;
  } catch (error) {
    logger.error(`Initial MongoDB connection to ${safeUri} failed`, error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  if (isConnected || mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('MongoDB connection closed cleanly.');
  }
}

export function isDbConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}
