import { z } from 'zod';
import { ATTRIBUTE_TYPES } from './types';

const slug = z.union([
  z.literal(''),
  z
    .string()
    .regex(/^[a-z0-9-]+$/, 'Lowercase letters, digits, hyphens')
    .max(140),
]);

/** Mirrors CreateAttributeDto. */
export const createAttributeSchema = z.object({
  name: z.string().min(1, 'Required').max(80),
  slug: slug.optional(),
  type: z.enum(ATTRIBUTE_TYPES as [string, ...string[]]),
  isVariation: z.boolean(),
  isFilterable: z.boolean(),
  sortOrder: z.number().int('Whole number').min(0, 'Cannot be negative'),
});
export type CreateAttributeInput = z.infer<typeof createAttributeSchema>;

/** Mirrors UpdateAttributeDto (type immutable). */
export const updateAttributeSchema = createAttributeSchema.omit({ type: true });
export type UpdateAttributeInput = z.infer<typeof updateAttributeSchema>;

/** Mirrors CreateAttributeValueDto + a hex helper for COLOR meta. */
export const valueSchema = z.object({
  value: z.string().min(1, 'Required').max(120),
  slug: slug.optional(),
  sortOrder: z.number().int('Whole number').min(0, 'Cannot be negative'),
  hex: z.union([z.literal(''), z.string().regex(/^#([0-9a-fA-F]{6})$/, 'Use #rrggbb')]).optional(),
});
export type ValueInput = z.infer<typeof valueSchema>;
