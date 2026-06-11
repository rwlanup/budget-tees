import { z } from 'zod';

/** Contact + method selections validated before placing. Address/pickup chosen via selection state. */
export const checkoutSchema = z.object({
  fulfillmentMethod: z.enum(['DELIVERY', 'PICKUP']),
  paymentMethod: z.enum(['ESEWA', 'COD']),
  contactEmail: z.email('Enter a valid email'),
  contactPhone: z.string().min(5, 'Enter a valid phone').max(20),
  customerNote: z.string().max(500).optional().or(z.literal('')),
});
export type CheckoutFormInput = z.infer<typeof checkoutSchema>;
