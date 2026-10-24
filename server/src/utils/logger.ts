const SENSITIVE_KEYS = new Set([
  'password',
  'accountpassword',
  'masterpassword',
  'vaultkey',
  'secret',
  'token',
  'authorization',
  'cookie',
  'recoverycodes',
  'encryptedsecretpayload',
  'ciphertext'
]);

export function redactSensitiveData(data: any): any {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map((item) => redactSensitiveData(item));
  }

  const redacted: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey)) {
      redacted[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      redacted[key] = redactSensitiveData(value);
    } else {
      redacted[key] = value;
    }
  }
  return redacted;
}

export const logger = {
  info: (msg: string, meta?: any) => {
    if (meta) {
      console.log(`[INFO] ${msg}`, redactSensitiveData(meta));
    } else {
      console.log(`[INFO] ${msg}`);
    }
  },
  warn: (msg: string, meta?: any) => {
    if (meta) {
      console.warn(`[WARN] ${msg}`, redactSensitiveData(meta));
    } else {
      console.warn(`[WARN] ${msg}`);
    }
  },
  error: (msg: string, error?: any) => {
    if (error instanceof Error) {
      console.error(`[ERROR] ${msg}: ${error.message}`);
    } else if (error) {
      console.error(`[ERROR] ${msg}`, redactSensitiveData(error));
    } else {
      console.error(`[ERROR] ${msg}`);
    }
  }
};
