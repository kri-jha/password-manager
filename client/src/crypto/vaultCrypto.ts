import { IEncryptedSecretPayload, IDecryptedSecretData, PasswordGeneratorOptions, IVaultAuthVerifier } from '../types/index.js';

// Base64 helper utilities
function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64: string): Uint8Array {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Generate cryptographically secure random salt in Base64 (16 bytes)
 */
export function generateRandomSalt(bytesCount: number = 16): string {
  const array = new Uint8Array(bytesCount);
  window.crypto.getRandomValues(array);
  return arrayBufferToBase64(array);
}

/**
 * Derive AES-256-GCM CryptoKey from Master Password using PBKDF2 (SHA-256, 100,000 iterations).
 * The master password never leaves this client execution context.
 */
export async function deriveVaultKey(masterPassword: string, saltBase64: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(masterPassword);
  const salt = base64ToArrayBuffer(saltBase64);

  // 1. Import raw password as key material
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  // 2. Derive 256-bit AES-GCM encryption key
  const vaultKey = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as any,
      iterations: 100000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false, // Non-extractable for maximum in-memory security
    ['encrypt', 'decrypt']
  );

  return vaultKey;
}

/**
 * Encrypt sensitive credential data locally before sending to backend.
 * Uses AES-256-GCM with a 12-byte unique random nonce for every operation.
 */
export async function encryptCredentialPayload(
  secretData: IDecryptedSecretData,
  vaultKey: CryptoKey
): Promise<IEncryptedSecretPayload> {
  const encoder = new TextEncoder();
  const plaintext = JSON.stringify(secretData);
  const dataBuffer = encoder.encode(plaintext);

  // 12-byte initialization vector (standard for GCM)
  const iv = new Uint8Array(12);
  window.crypto.getRandomValues(iv);

  // Web Crypto AES-GCM output contains ciphertext + 16-byte auth tag at the end
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
      tagLength: 128
    },
    vaultKey,
    dataBuffer
  );

  const fullBytes = new Uint8Array(encryptedBuffer);
  // Split ciphertext and 16-byte authentication tag
  const tagBytes = fullBytes.slice(fullBytes.length - 16);
  const cipherBytes = fullBytes.slice(0, fullBytes.length - 16);

  return {
    ciphertext: arrayBufferToBase64(cipherBytes),
    iv: arrayBufferToBase64(iv),
    authTag: arrayBufferToBase64(tagBytes),
    version: 1
  };
}

/**
 * Decrypt credential payload locally in browser memory.
 */
export async function decryptCredentialPayload(
  encryptedPayload: IEncryptedSecretPayload,
  vaultKey: CryptoKey
): Promise<IDecryptedSecretData> {
  const iv = base64ToArrayBuffer(encryptedPayload.iv);
  const cipherBytes = base64ToArrayBuffer(encryptedPayload.ciphertext);
  const tagBytes = base64ToArrayBuffer(encryptedPayload.authTag);

  // Re-combine ciphertext + auth tag for Web Crypto SubtleCrypto.decrypt
  const combined = new Uint8Array(cipherBytes.length + tagBytes.length);
  combined.set(cipherBytes);
  combined.set(tagBytes, cipherBytes.length);

  try {
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as any,
        tagLength: 128
      },
      vaultKey,
      combined as any
    );

    const decoder = new TextDecoder();
    const plaintext = decoder.decode(decryptedBuffer);
    return JSON.parse(plaintext) as IDecryptedSecretData;
  } catch (error) {
    throw new Error('Vault decryption failed: Invalid key or corrupted secret payload.');
  }
}

/**
 * Create a client-side verifier challenge payload using the vault key.
 */
export async function createVaultVerifier(vaultKey: CryptoKey): Promise<IVaultAuthVerifier> {
  const challenge = { aegisVaultChallenge: 'VERIFIED_VALID_VAULT_KEY_2026' };
  const encrypted = await encryptCredentialPayload(challenge as any, vaultKey);
  return {
    ciphertext: encrypted.ciphertext,
    iv: encrypted.iv,
    authTag: encrypted.authTag,
    version: 1
  };
}

/**
 * Verify if the derived vault key matches the user's stored verifier challenge.
 */
export async function verifyVaultKey(verifier: IVaultAuthVerifier, vaultKey: CryptoKey): Promise<boolean> {
  try {
    const decrypted = await decryptCredentialPayload(
      {
        ciphertext: verifier.ciphertext,
        iv: verifier.iv,
        authTag: verifier.authTag,
        version: verifier.version
      },
      vaultKey
    );
    return (decrypted as any).aegisVaultChallenge === 'VERIFIED_VALID_VAULT_KEY_2026';
  } catch {
    return false;
  }
}

/**
 * Cryptographically secure password generator using Web Crypto API.
 * Never uses Math.random().
 */
export function generateSecurePassword(options: PasswordGeneratorOptions): string {
  const {
    length = 16,
    useUppercase = true,
    useLowercase = true,
    useNumbers = true,
    useSymbols = true,
    excludeAmbiguous = true
  } = options;

  let upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let lower = 'abcdefghijklmnopqrstuvwxyz';
  let numbers = '0123456789';
  let symbols = '!@#$%^&*()-_=+[]{}|;:,.<>?';

  if (excludeAmbiguous) {
    const ambiguousChars = new Set(['I', 'l', '1', 'O', '0', '{', '}', '[', ']', '(', ')', '/', '\\', '\'', '"', '`', '~', ',', ';', ':', '.', '<', '>', '|']);
    upper = upper.split('').filter(c => !ambiguousChars.has(c)).join('');
    lower = lower.split('').filter(c => !ambiguousChars.has(c)).join('');
    numbers = numbers.split('').filter(c => !ambiguousChars.has(c)).join('');
    symbols = symbols.split('').filter(c => !ambiguousChars.has(c)).join('');
  }

  let charset = '';
  const guaranteedChars: string[] = [];

  // Helper for cryptographically secure random index
  const getRandomChar = (str: string): string => {
    if (!str.length) return '';
    const randomArray = new Uint32Array(1);
    window.crypto.getRandomValues(randomArray);
    return str[randomArray[0] % str.length];
  };

  if (useUppercase && upper.length) {
    charset += upper;
    guaranteedChars.push(getRandomChar(upper));
  }
  if (useLowercase && lower.length) {
    charset += lower;
    guaranteedChars.push(getRandomChar(lower));
  }
  if (useNumbers && numbers.length) {
    charset += numbers;
    guaranteedChars.push(getRandomChar(numbers));
  }
  if (useSymbols && symbols.length) {
    charset += symbols;
    guaranteedChars.push(getRandomChar(symbols));
  }

  // Fallback if user unchecks all
  if (charset.length === 0) {
    charset = lower.length ? lower : 'abcdefghjkmnpqrstuvwxyz';
  }

  const resultChars: string[] = [...guaranteedChars];
  const remainingLength = Math.max(0, length - guaranteedChars.length);

  const randomBuffer = new Uint32Array(remainingLength);
  window.crypto.getRandomValues(randomBuffer);

  for (let i = 0; i < remainingLength; i++) {
    resultChars.push(charset[randomBuffer[i] % charset.length]);
  }

  // Cryptographically shuffle results using Fisher-Yates with crypto.getRandomValues
  for (let i = resultChars.length - 1; i > 0; i--) {
    const r = new Uint32Array(1);
    window.crypto.getRandomValues(r);
    const j = r[0] % (i + 1);
    [resultChars[i], resultChars[j]] = [resultChars[j], resultChars[i]];
  }

  return resultChars.join('');
}

/**
 * Evaluate password entropy and strength.
 */
export function calculatePasswordStrength(password: string): {
  score: number; // 0 to 4
  label: 'Very Weak' | 'Weak' | 'Medium' | 'Strong' | 'Very Strong';
  color: string;
} {
  if (!password) return { score: 0, label: 'Very Weak', color: 'bg-rose-500' };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 14) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-rose-500' };
  if (score === 2) return { score: 2, label: 'Medium', color: 'bg-amber-500' };
  if (score === 3) return { score: 3, label: 'Strong', color: 'bg-emerald-500' };
  return { score: 4, label: 'Very Strong', color: 'bg-indigo-500' };
}
