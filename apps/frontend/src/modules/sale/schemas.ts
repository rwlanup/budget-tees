import { z } from 'zod';
import { SALE_SCOPES, SALE_TYPES } from './types';

const dateTime = z.string().min(1, 'Required');

const windowRefine = (d: { startsAt: string; endsAt: string }, ctx: z.RefinementCtx) => {
  if (d.startsAt && d.endsAt && new Date(d.endsAt) <= new Date(d.startsAt)) {
    ctx.addIssue({ code: 'custom', message: 'End must be after start', path: ['endsAt'] });
  }
};

/** Mirrors CreateSaleDto. */
export const createSaleSchema = z
  .object({
    name: z.string().min(2, 'At least 2 characters').max(120),
    type: z.enum(SALE_TYPES as [string, ...string[]]),
    value: z.number().min(0, 'Cannot be negative'),
    maxDiscountAmount: z.number().min(0).nullable(),
    scope: z.enum(SALE_SCOPES as [string, ...string[]]),
    productIds: z.array(z.string()),
    categoryIds: z.array(z.string()),
    excludedProductIds: z.array(z.string()),
    startsAt: dateTime,
    endsAt: dateTime,
    isActive: z.boolean(),
  })
  .superRefine((d, ctx) => {
    if (d.type === 'PERCENTAGE' && d.value > 100) {
      ctx.addIssue({ code: 'custom', message: 'Percentage cannot exceed 100', path: ['value'] });
    }
    if (d.scope === 'PRODUCTS' && d.productIds.length === 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'Select at least one product',
        path: ['productIds'],
      });
    }
    if (d.scope === 'CATEGORIES' && d.categoryIds.length === 0) {
      ctx.addIssue({
        code: 'custom',
        message: 'Select at least one category',
        path: ['categoryIds'],
      });
    }
    windowRefine(d, ctx);
  });
export type CreateSaleInput = z.infer<typeof createSaleSchema>;

/** Mirrors UpdateSaleDto (type & scope immutable; links replace only when toggled). */
export const updateSaleSchema = z
  .object({
    name: z.string().min(2, 'At least 2 characters').max(120),
    value: z.number().min(0, 'Cannot be negative'),
    maxDiscountAmount: z.number().min(0).nullable(),
    startsAt: dateTime,
    endsAt: dateTime,
    isActive: z.boolean(),
    replaceTargets: z.boolean(),
    productIds: z.array(z.string()),
    categoryIds: z.array(z.string()),
    excludedProductIds: z.array(z.string()),
  })
  .superRefine((d, ctx) => windowRefine(d, ctx));
export type UpdateSaleInput = z.infer<typeof updateSaleSchema>;
