import { z } from 'zod';

export const createCategorySchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(1, 'Category name is required')
      .max(64, 'Category name cannot exceed 64 characters'),
    icon: z
      .string()
      .trim()
      .max(32, 'Icon name cannot exceed 32 characters')
      .default('folder'),
    color: z
      .string()
      .trim()
      .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Color must be a valid hex color code')
      .default('#6366f1')
  })
});

export const updateCategorySchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID format')
  }),
  body: z.object({
    name: z
      .string()
      .trim()
      .min(1, 'Category name cannot be empty')
      .max(64, 'Category name cannot exceed 64 characters')
      .optional(),
    icon: z
      .string()
      .trim()
      .max(32, 'Icon name cannot exceed 32 characters')
      .optional(),
    color: z
      .string()
      .trim()
      .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Color must be a valid hex color code')
      .optional()
  })
});

export const categoryIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID format')
  })
});
