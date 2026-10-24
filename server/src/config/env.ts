import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required and cannot be empty'),
  SESSION_SECRET: z.string().min(16, 'SESSION_SECRET must be at least 16 characters long'),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173')
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  // If in test environment without explicit MONGODB_URI, allow test setup to provide it later (e.g. MongoMemoryServer)
  if (process.env.NODE_ENV === 'test') {
    // defaults for testing
    process.env.PORT = process.env.PORT || '5001';
    process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/test_password_saver';
    process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test_super_secret_session_key_32bytes_long';
    process.env.CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
  } else {
    console.error('❌ FATAL CONFIGURATION ERROR: Invalid environment variables:');
    parsedEnv.error.errors.forEach((err) => {
      console.error(` - [${err.path.join('.')}]: ${err.message}`);
    });
    console.error('Please configure your .env file according to .env.example');
    process.exit(1);
  }
}

export const env = parsedEnv.success ? parsedEnv.data : {
  PORT: parseInt(process.env.PORT || '5001', 10),
  NODE_ENV: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'test',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/test_password_saver',
  SESSION_SECRET: process.env.SESSION_SECRET || 'test_super_secret_session_key_32bytes_long',
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:5173'
};
