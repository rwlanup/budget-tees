import { z } from 'zod';

/** Mirrors AddFeaturedDto. */
export const addFeaturedSchema = z.object({
  productId: z.uuid('Select a product'),
  sortOrder: z.number().int('Whole number').min(0, 'Cannot be negative'),
});
export type AddFeaturedInput = z.infer<typeof addFeaturedSchema>;
