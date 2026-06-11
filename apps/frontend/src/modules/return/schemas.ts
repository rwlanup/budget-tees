import { z } from 'zod';

/** Mirrors backend CreateReturnDto + ReturnItemInputDto. EXCHANGE requires exchangeSkuId per item. */
export const createReturnItemSchema = z.object({
  orderItemId: z.string().uuid(),
  quantity: z.number().int().min(1),
  exchangeSkuId: z.string().uuid().optional(),
});

export const createReturnSchema = z
  .object({
    resolutionType: z.enum(['REFUND', 'EXCHANGE']),
    reason: z.enum([
      'DAMAGED',
      'WRONG_ITEM',
      'WRONG_SIZE',
      'NOT_AS_DESCRIBED',
      'CHANGED_MIND',
      'OTHER',
    ]),
    customerNote: z.string().max(500).optional(),
    items: z.array(createReturnItemSchema).min(1, 'Select at least one item to return.'),
  })
  .refine(
    (v) => v.resolutionType !== 'EXCHANGE' || v.items.every((i) => !!i.exchangeSkuId),
    { message: 'Pick a replacement variant for every item.', path: ['items'] },
  );

export type CreateReturnInput = z.infer<typeof createReturnSchema>;
