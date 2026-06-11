import { z } from 'zod';

/** Mirrors RefundDto. */
export const refundSchema = z.object({
  amount: z.number().min(0.01, 'Enter an amount'),
  reason: z.string().min(1, 'Required').max(255),
  externalRef: z.string().max(120).optional().or(z.literal('')),
});
export type RefundInput = z.infer<typeof refundSchema>;
