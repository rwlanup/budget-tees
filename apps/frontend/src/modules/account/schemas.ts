import { z } from 'zod';
import { isValidPhoneNumber } from 'react-phone-number-input';

/** Mirrors UpdateProfileDto (self). */
export const profileSchema = z.object({
  firstName: z.string().min(1, 'Required').max(100),
  lastName: z.string().min(1, 'Required').max(100),
});
export type ProfileInput = z.infer<typeof profileSchema>;

/** Mirrors CreateAddressDto / UpdateAddressDto. */
export const addressSchema = z.object({
  type: z.enum(['SHIPPING', 'BILLING', 'BOTH']),
  label: z.string().max(40).optional().or(z.literal('')),
  recipientName: z.string().min(1, 'Required').max(120),
  phone: z.string().refine(isValidPhoneNumber, 'Enter a valid phone number'),
  email: z.email('Enter a valid email').optional().or(z.literal('')),
  line1: z.string().min(1, 'Required').max(180),
  line2: z.string().max(180).optional().or(z.literal('')),
  city: z.string().min(1, 'Required').max(100),
  region: z.string().max(100).optional().or(z.literal('')),
  countryCode: z.string().length(2, 'Select a country'),
  postalCode: z.string().max(20).optional().or(z.literal('')),
  nearestLandmark: z.string().max(180).optional().or(z.literal('')),
  isDefault: z.boolean(),
});
export type AddressInput = z.infer<typeof addressSchema>;
