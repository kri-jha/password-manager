import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import {
  hashAccountPassword,
  verifyAccountPassword,
  encryptAES256GCM,
  decryptAES256GCM,
  generateRandomSalt
} from '../src/utils/encryption.js';

describe('Cryptographic Engine & Format Compatibility', () => {
  it('should hash and verify passwords using Argon2id', async () => {
    const rawPassword = 'SuperSecretMasterP@ss123!';
    const hash = await hashAccountPassword(rawPassword);

    expect(hash).toContain('$argon2id$');

    const isValid = await verifyAccountPassword(hash, rawPassword);
    expect(isValid).toBe(true);

    const isInvalid = await verifyAccountPassword(hash, 'WrongPassword');
    expect(isInvalid).toBe(false);
  });

  it('should encrypt and decrypt payloads with authenticated AES-256-GCM', () => {
    const key = crypto.randomBytes(32); // 256 bits
    const sensitiveJson = JSON.stringify({
      username: 'alice@vault.org',
      password: 'GeneratedSecurePassword#2026',
      notes: 'Server root credentials',
      recoveryCodes: ['1234-5678', '9012-3456']
    });

    const encrypted = encryptAES256GCM(sensitiveJson, key);

    // Verify payload structure matches agreed client/server contract
    expect(encrypted.ciphertext).toBeDefined();
    expect(encrypted.iv).toBeDefined();
    expect(encrypted.authTag).toBeDefined();
    expect(encrypted.version).toBe(1);

    // Decrypt and assert exact match
    const decrypted = decryptAES256GCM(encrypted, key);
    expect(decrypted).toBe(sensitiveJson);

    const parsed = JSON.parse(decrypted);
    expect(parsed.username).toBe('alice@vault.org');
    expect(parsed.recoveryCodes).toHaveLength(2);
  });

  it('should fail decryption if authTag is tampered with (integrity verification)', () => {
    const key = crypto.randomBytes(32);
    const encrypted = encryptAES256GCM('top secret data', key);

    // Tamper with ciphertext
    const tamperedPayload = {
      ...encrypted,
      ciphertext: Buffer.from('TamperedData').toString('base64')
    };

    expect(() => decryptAES256GCM(tamperedPayload, key)).toThrow();
  });

  it('should generate secure random salts in Base64', () => {
    const salt1 = generateRandomSalt(16);
    const salt2 = generateRandomSalt(16);

    expect(salt1).not.toBe(salt2);
    expect(Buffer.from(salt1, 'base64').length).toBe(16);
  });
});
