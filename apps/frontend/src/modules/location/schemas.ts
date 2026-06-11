import { z } from 'zod';

const optionalEmail = z.union([z.literal(''), z.email('Enter a valid email')]).optional();

/** Mirrors CreatePickupDto. openingHours handled as JSON text in the form. */
export const pickupSchema = z.object({
  name: z.string().min(2, 'At least 2 characters').max(120),
  phone: z.string().max(20).optional().or(z.literal('')),
  email: optionalEmail,
  line1: z.string().min(1, 'Required').max(180),
  city: z.string().min(1, 'Required').max(100),
  region: z.string().max(100).optional().or(z.literal('')),
  countryCode: z.string().regex(/^[A-Za-z]{2}$/, 'Select a country'),
  postalCode: z.string().max(20).optional().or(z.literal('')),
  latitude: z.string().max(20).optional().or(z.literal('')),
  longitude: z.string().max(20).optional().or(z.literal('')),
  openingHours: z.string().optional().or(z.literal('')),
  isActive: z.boolean(),
});
export type PickupInput = z.infer<typeof pickupSchema>;

/** Mirrors CreateZoneDto. regions entered as multiline text → array on submit. */
export const zoneSchema = z
  .object({
    name: z.string().min(2, 'At least 2 characters').max(100),
    countryCode: z.string().regex(/^[A-Za-z]{2}$/, 'Select a country'),
    isCountryWide: z.boolean(),
    regions: z.string().optional().or(z.literal('')),
    flatRate: z.number().min(0, 'Cannot be negative'),
    freeShippingThreshold: z.number().min(0, 'Cannot be negative').nullable(),
    isActive: z.boolean(),
    sortOrder: z.number().int('Whole number').min(0, 'Cannot be negative'),
  })
  .refine((d) => d.isCountryWide || (d.regions ?? '').split('\n').some((r) => r.trim()), {
    message: 'Add at least one region, or mark the zone country-wide',
    path: ['regions'],
  });
export type ZoneInput = z.infer<typeof zoneSchema>;
