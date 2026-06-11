import { z } from 'zod';

const slug = z
  .string()
  .regex(/^[a-z0-9-]+$/, 'Lowercase letters, digits, and hyphens only')
  .max(80);

/** Mirrors CreateTagDto. */
export const createTagSchema = z.object({
  name: z.string().min(2, 'At least 2 characters').max(60),
  slug: z.union([z.literal(''), slug]).optional(),
  isActive: z.boolean(),
});
export type CreateTagInput = z.infer<typeof createTagSchema>;

/** Mirrors UpdateTagDto (same shape). */
export const updateTagSchema = createTagSchema;
export type UpdateTagInput = CreateTagInput;
