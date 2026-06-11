import { z } from 'zod';
import { PRODUCT_TYPES } from './types';

const baseFields = {
  name: z.string().min(2, 'At least 2 characters').max(180),
  slug: z.union([z.literal(''), z.string().min(1).max(200)]).optional(),
  shortDescription: z.string().max(500).optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  categoryId: z.uuid('Select a category'),
  brandId: z.string().nullable(),
  taxClassId: z.string().nullable(),
  type: z.enum(PRODUCT_TYPES as [string, ...string[]]),
  metaTitle: z.string().max(255).optional().or(z.literal('')),
  metaDescription: z.string().max(255).optional().or(z.literal('')),
};

/** Mirrors CreateProductDto (+ tagIds, saved with create). */
export const createProductSchema = z.object({
  ...baseFields,
  tagIds: z.array(z.string()),
});
export type CreateProductInput = z.infer<typeof createProductSchema>;

/** Mirrors UpdateProductDto (tags managed separately via setTags). */
export const updateProductSchema = z.object(baseFields);
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
