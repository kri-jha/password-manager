import { z } from 'zod';

const encryptedPayloadSchema = z.object({
  ciphertext: z.string().min(1, 'Ciphertext is required').max(65536, 'Ciphertext exceeds maximum allowed length'),
  iv: z.string().min(12, 'IV must be a valid Base64 string').max(64),
  authTag: z.string().min(16, 'AuthTag must be a valid Base64 string').max(64),
  salt: z.string().max(128).optional(),
  version: z.number().int().min(1).default(1)
});

export const createCredentialSchema = z.object({
  body: z.object({
    title: z
      .string()
      .trim()
      .min(1, 'Title is required')
      .max(120, 'Title cannot exceed 120 characters'),
    website: z
      .string()
      .trim()
      .max(255, 'Website URL cannot exceed 255 characters')
      .optional()
      .default(''),
    categoryId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID')
      .nullable()
      .optional(),
    encryptedSecretPayload: encryptedPayloadSchema,
    encryptionVersion: z.number().int().min(1).default(1),
    favorite: z.boolean().optional().default(false)
  })
});

export const updateCredentialSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid credential ID format')
  }),
  body: z.object({
    title: z
      .string()
      .trim()
      .min(1, 'Title cannot be empty')
      .max(120, 'Title cannot exceed 120 characters')
      .optional(),
    website: z
      .string()
      .trim()
      .max(255, 'Website URL cannot exceed 255 characters')
      .optional(),
    categoryId: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID')
      .nullable()
      .optional(),
    encryptedSecretPayload: encryptedPayloadSchema.optional(),
    encryptionVersion: z.number().int().min(1).optional(),
    favorite: z.boolean().optional()
  })
});

export const credentialIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid credential ID format')
  })
});

export const listCredentialsQuerySchema = z.object({
  query: z.object({
    categoryId: z.string().optional(),
    favorite: z
      .string()
      .transform((val: string) => val === 'true')
      .optional(),
    search: z.string().trim().optional(),
    sortBy: z.enum(['title', 'createdAt', 'updatedAt', 'lastUsedAt']).optional().default('updatedAt'),
    order: z.enum(['asc', 'desc']).optional().default('desc'),
    page: z
      .string()
      .transform((val: string) => Math.max(1, parseInt(val, 10) || 1))
      .optional()
      .default('1'),
    limit: z
      .string()
      .transform((val: string) => Math.min(100, Math.max(1, parseInt(val, 10) || 20)))
      .optional()
      .default('20')
  })
});
