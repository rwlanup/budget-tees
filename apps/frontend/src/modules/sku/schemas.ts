import { z } from 'zod';

const money = z.number().min(0, 'Cannot be negative');
const moneyNullable = z.number().min(0, 'Cannot be negative').nullable();
const intNonNeg = z.number().int('Whole number').min(0, 'Cannot be negative');

/** Mirrors CreateSkuDto (combo + pricing + inventory). */
export const createSkuSchema = z
  .object({
    attributeValueIds: z.array(z.string()),
    name: z.string().max(200).optional().or(z.literal('')),
    sku: z.string().max(64).optional().or(z.literal('')),
    barcode: z.string().max(64).optional().or(z.literal('')),
    price: money,
    compareAtPrice: moneyNullable,
    costPrice: moneyNullable,
    stock: intNonNeg,
    lowStockThreshold: intNonNeg,
    allowBackorder: z.boolean(),
    weightGrams: z.number().int().min(0).nullable(),
    imageMediaId: z.string().nullable(),
  })
  .refine(
    (data) => {
      if (data.compareAtPrice == null || data.price == null) return true;
      return data.compareAtPrice > data.price;
    },
    {
      message: 'Compare at price must be greater than actual price',
      path: ['compareAtPrice'],
    },
  );
export type CreateSkuInput = z.infer<typeof createSkuSchema>;

/** Mirrors UpdateSkuDto (combo immutable; + active/default). */
export const updateSkuSchema = z
  .object({
    name: z.string().max(200).optional().or(z.literal('')),
    sku: z.string().min(1).max(64),
    barcode: z.string().max(64).optional().or(z.literal('')),
    price: money,
    compareAtPrice: moneyNullable,
    costPrice: moneyNullable,
    lowStockThreshold: intNonNeg,
    allowBackorder: z.boolean(),
    weightGrams: z.number().int().min(0).nullable(),
    imageMediaId: z.string().nullable(),
    isActive: z.boolean(),
    isDefault: z.boolean(),
  })
  .refine(
    (data) => {
      if (data.compareAtPrice == null || data.price == null) return true;
      return data.compareAtPrice > data.price;
    },
    {
      message: 'Compare at price must be greater than actual price',
      path: ['compareAtPrice'],
    },
  );
export type UpdateSkuInput = z.infer<typeof updateSkuSchema>;

/** adjust-stock — exactly one of delta/setTo (UI uses a mode switch). */
export const adjustStockSchema = z.object({
  mode: z.enum(['delta', 'set']),
  value: z.number().int('Whole number'),
  reason: z.string().min(1, 'Required').max(255),
});
export type AdjustStockInput = z.infer<typeof adjustStockSchema>;

/** Mirrors GenerateSkusDto. */
export const generateSchema = z.object({
  defaultPrice: z.number().min(0).nullable(),
  defaultStock: z.number().int().min(0).nullable(),
  skuCodePrefix: z.string().max(40).optional().or(z.literal('')),
});
export type GenerateInput = z.infer<typeof generateSchema>;
