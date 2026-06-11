import { z } from 'zod';

/** Mirrors CreateBrandDto / UpdateBrandDto. */
export const brandSchema = z.object({
  name: z.string().min(2, 'At least 2 characters').max(120),
  slug: z
    .union([
      z.literal(''),
      z
        .string()
        .regex(/^[a-z0-9-]+$/, 'Lowercase letters, digits, hyphens')
        .max(140),
    ])
    .optional(),
  description: z.string().optional().or(z.literal('')),
  logoMediaId: z.string().nullable(),
  websiteUrl: z
    .union([z.literal(''), z.url('Enter a full URL, e.g. https://example.com')])
    .optional(),
  isActive: z.boolean(),
  metaTitle: z.string().max(255).optional().or(z.literal('')),
  metaDescription: z.string().max(255).optional().or(z.literal('')),
});
export type BrandInput = z.infer<typeof brandSchema>;
