import { z } from 'zod';

const slug = z
  .string()
  .regex(/^[a-z0-9-]+$/, 'Lowercase letters, digits, and hyphens only')
  .max(140);

const baseFields = {
  name: z.string().min(2, 'At least 2 characters').max(120),
  slug: z.union([z.literal(''), slug]).optional(),
  description: z.string().optional().or(z.literal('')),
  imageMediaId: z.string().nullable(),
  sortOrder: z.number().int('Whole number').min(0, 'Cannot be negative'),
  isActive: z.boolean(),
  metaTitle: z.string().max(255).optional().or(z.literal('')),
  metaDescription: z.string().max(255).optional().or(z.literal('')),
};

/** Mirrors CreateCategoryDto (parentId set at create time). */
export const createCategorySchema = z.object({
  ...baseFields,
  parentId: z.string().nullable(),
});
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;

/** Mirrors UpdateCategoryDto (no parentId — parent change uses move). */
export const updateCategorySchema = z.object(baseFields);
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
