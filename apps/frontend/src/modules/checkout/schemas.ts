import { z } from 'zod';
import { isValidPhoneNumber } from 'react-phone-number-input';

/** Contact + method selections validated before placing. Address/pickup chosen via selection state. */
export const checkoutSchema = z.object({
  fulfillmentMethod: z.enum(['DELIVERY', 'PICKUP']),
  paymentMethod: z.enum(['ESEWA', 'COD']),
  contactEmail: z.email('Enter a valid email'),
  contactPhone: z.string().refine(isValidPhoneNumber, 'Enter a valid phone number'),
  customerNote: z.string().max(500).optional().or(z.literal('')),
});
export type CheckoutFormInput = z.infer<typeof checkoutSchema>;
