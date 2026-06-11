import { z } from 'zod';

/** Mirrors CreateReviewDto / UpdateReviewDto (rating 1–5; title/body optional). */
export const reviewSchema = z.object({
  rating: z.number().int().min(1, 'Select a rating').max(5),
  title: z.string().max(120).optional().or(z.literal('')),
  body: z.string().max(2000).optional().or(z.literal('')),
});
export type ReviewInput = z.infer<typeof reviewSchema>;
