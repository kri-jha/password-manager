import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z
      .string()
      .trim()
      .min(3, 'Email is required')
      .max(255, 'Email is too long')
      .email('Invalid email address format'),
    password: z
      .string()
      .min(8, 'Account password must be at least 8 characters')
      .max(128, 'Account password is too long')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    vaultSalt: z
      .string()
      .min(16, 'Vault salt must be at least 16 characters Base64 string'),
    vaultAuthVerifier: z
      .object({
        ciphertext: z.string().min(1, 'Ciphertext is required'),
        iv: z.string().min(1, 'IV is required'),
        authTag: z.string().min(1, 'AuthTag is required'),
        version: z.number().default(1)
      })
      .optional()
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string()
      .trim()
      .min(1, 'Email is required')
      .email('Invalid email address format'),
    password: z
      .string()
      .min(1, 'Password is required')
  })
});

export const updateVaultVerifierSchema = z.object({
  body: z.object({
    vaultSalt: z.string().min(16, 'Vault salt must be at least 16 characters Base64 string'),
    vaultAuthVerifier: z.object({
      ciphertext: z.string().min(1, 'Ciphertext is required'),
      iv: z.string().min(1, 'IV is required'),
      authTag: z.string().min(1, 'AuthTag is required'),
      version: z.number().default(1)
    })
  })
});

export const updateAccountSettingsSchema = z.object({
  body: z.object({
    inactivityTimeoutMinutes: z.number().int().min(1).max(1440).optional(),
    currentPassword: z.string().min(1, 'Current password is required').optional(),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .max(128, 'New password is too long')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .optional()
  })
});
