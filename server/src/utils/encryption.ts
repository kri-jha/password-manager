import crypto from 'crypto';
import argon2 from 'argon2';

/**
 * Hash an account login password using Argon2id with secure memory, iterations, and parallelism parameters.
 */
export async function hashAccountPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MB
    timeCost: 3,       // 3 iterations
    parallelism: 4
  });
}

/**
 * Verify an account login password against its Argon2id hash.
 */
export async function verifyAccountPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, password);
  } catch {
    return false;
  }
}

/**
 * Server-side AES-256-GCM authenticated encryption utility.
 * Used for server-managed secrets and token signing verification.
 */
export interface EncryptedData {
  ciphertext: string; // Base64
  iv: string;         // Base64 (12 bytes for GCM)
  authTag: string;    // Base64 (16 bytes)
  salt?: string;      // Base64
  version: number;
}

export function encryptAES256GCM(plaintext: string, secretKey: Buffer): EncryptedData {
  if (secretKey.length !== 32) {
    throw new Error('Encryption key must be exactly 32 bytes (256 bits).');
  }

  // 12-byte initialization vector (standard for GCM)
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', secretKey, iv);

  let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
  ciphertext += cipher.final('base64');
  const authTag = cipher.getAuthTag().toString('base64');

  return {
    ciphertext,
    iv: iv.toString('base64'),
    authTag,
    version: 1
  };
}

export function decryptAES256GCM(encrypted: EncryptedData, secretKey: Buffer): string {
  if (secretKey.length !== 32) {
    throw new Error('Encryption key must be exactly 32 bytes (256 bits).');
  }

  const iv = Buffer.from(encrypted.iv, 'base64');
  const authTag = Buffer.from(encrypted.authTag, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', secretKey, iv);

  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted.ciphertext, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Generate cryptographically secure random salt in Base64
 */
export function generateRandomSalt(bytes: number = 16): string {
  return crypto.randomBytes(bytes).toString('base64');
}
