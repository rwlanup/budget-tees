import { z } from 'zod';
import { COUPON_APPLIES_TO, COUPON_TYPES } from './types';

const dt = z.string().optional().or(z.literal(''));

const windowRefine = (d: { startsAt?: string; endsAt?: string }, ctx: z.RefinementCtx) => {
  if (d.startsAt && d.endsAt && new Date(d.endsAt) <= new Date(d.startsAt)) {
    ctx.addIssue({ code: 'custom', message: 'End must be after start', path: ['endsAt'] });
  }
};

const valueRefine = (d: { type?: string; value: number | null }, ctx: z.RefinementCtx) => {
  if (d.type === 'FREE_SHIPPING') return;
  if (d.value === null || d.value === undefined) {
    ctx.addIssue({ code: 'custom', message: 'Required', path: ['value'] });
  } else if (d.type === 'PERCENTAGE' && d.value > 100) {
    ctx.addIssue({ code: 'custom', message: 'Percentage cannot exceed 100', path: ['value'] });
  }
};

/** Mirrors CreateCouponDto. */
export const createCouponSchema = z
  .object({
    code: z
      .string()
      .min(3, 'At least 3 characters')
      .max(40)
      .regex(/^[A-Za-z0-9_-]+$/, 'Letters, digits, _ or - only'),
    description: z.string().max(255).optional().or(z.literal('')),
    type: z.enum(COUPON_TYPES as [string, ...string[]]),
    value: z.number().min(0).nullable(),
    maxDiscountAmount: z.number().min(0).nullable(),
    minOrderAmount: z.number().min(0).nullable(),
    appliesTo: z.enum(COUPON_APPLIES_TO as [string, ...string[]]),
    productIds: z.array(z.string()),
    categoryIds: z.array(z.string()),
    firstOrderOnly: z.boolean(),
    usageLimit: z.number().int().min(1).nullable(),
    usageLimitPerUser: z.number().int().min(1).nullable(),
    startsAt: dt,
    endsAt: dt,
    isActive: z.boolean(),
  })
  .superRefine((d, ctx) => {
    valueRefine(d, ctx);
    windowRefine(d, ctx);
    if (d.appliesTo === 'PRODUCTS' && d.productIds.length === 0)
      ctx.addIssue({
        code: 'custom',
        message: 'Select at least one product',
        path: ['productIds'],
      });
    if (d.appliesTo === 'CATEGORIES' && d.categoryIds.length === 0)
      ctx.addIssue({
        code: 'custom',
        message: 'Select at least one category',
        path: ['categoryIds'],
      });
  });
export type CreateCouponInput = z.infer<typeof createCouponSchema>;

/** Mirrors UpdateCouponDto (code, type, appliesTo immutable). */
export const updateCouponSchema = z
  .object({
    description: z.string().max(255).optional().or(z.literal('')),
    value: z.number().min(0).nullable(),
    maxDiscountAmount: z.number().min(0).nullable(),
    minOrderAmount: z.number().min(0).nullable(),
    firstOrderOnly: z.boolean(),
    usageLimit: z.number().int().min(1).nullable(),
    usageLimitPerUser: z.number().int().min(1).nullable(),
    startsAt: dt,
    endsAt: dt,
    isActive: z.boolean(),
    replaceTargets: z.boolean(),
    productIds: z.array(z.string()),
    categoryIds: z.array(z.string()),
  })
  .superRefine((d, ctx) => windowRefine(d, ctx));
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;
