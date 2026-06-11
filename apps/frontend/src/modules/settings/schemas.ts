import { z } from 'zod';

/** Mirrors CreateShippingCountryDto. Code is uppercased on submit. */
export const createCountrySchema = z.object({
  code: z.string().regex(/^[A-Za-z]{2}$/, 'ISO alpha-2 code (2 letters)'),
  name: z.string().min(2, 'At least 2 characters').max(100),
  isActive: z.boolean(),
  sortOrder: z.number().int('Whole number').min(0, 'Cannot be negative'),
});
export type CreateCountryInput = z.infer<typeof createCountrySchema>;
