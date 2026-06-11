import { z } from 'zod';

/** Mirrors CreateTaxClassDto. */
export const createClassSchema = z.object({
  name: z.string().min(2, 'At least 2 characters').max(80),
  slug: z.string().min(1).max(100).optional().or(z.literal('')),
  isDefault: z.boolean(),
  isActive: z.boolean(),
});
export type CreateClassInput = z.infer<typeof createClassSchema>;

/** Mirrors UpdateTaxClassDto (slug immutable). */
export const updateClassSchema = z.object({
  name: z.string().min(2, 'At least 2 characters').max(80),
  isDefault: z.boolean(),
  isActive: z.boolean(),
});
export type UpdateClassInput = z.infer<typeof updateClassSchema>;

/** Mirrors CreateTaxRateDto. */
export const createRateSchema = z.object({
  taxClassId: z.uuid('Select a tax class'),
  name: z.string().min(1, 'Required').max(60),
  countryCode: z.string().regex(/^[A-Za-z]{2}$/, 'Select a country'),
  rate: z.number().min(0, 'Min 0').max(100, 'Max 100'),
  isActive: z.boolean(),
});
export type CreateRateInput = z.infer<typeof createRateSchema>;

/** Mirrors UpdateTaxRateDto (class + country immutable). */
export const updateRateSchema = z.object({
  name: z.string().min(1, 'Required').max(60),
  rate: z.number().min(0, 'Min 0').max(100, 'Max 100'),
  isActive: z.boolean(),
});
export type UpdateRateInput = z.infer<typeof updateRateSchema>;
