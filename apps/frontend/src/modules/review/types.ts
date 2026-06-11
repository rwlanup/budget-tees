import type { Paginated } from '@/types/api';

export type ReviewStatus = 'PUBLISHED' | 'HIDDEN';

/** Public review (author name only, no PII). Mirrors backend `PublicReview`. */
export interface PublicReview {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  authorName: string;
  createdAt: string;
}

/** Mirrors backend `ReviewSummary`. */
export interface ReviewSummary {
  average: number;
  count: number;
  distribution: Record<'1' | '2' | '3' | '4' | '5', number>;
}

export type PublicReviewList = Paginated<PublicReview> & { summary: ReviewSummary };

/** Caller's own review row (incl. HIDDEN). */
export interface MyReview {
  id: string;
  productId: string;
  rating: number;
  title: string | null;
  body: string | null;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewEligibility {
  hasPurchased: boolean;
  alreadyReviewed: boolean;
  canReview: boolean;
}

export interface MyReviewResponse {
  review: MyReview | null;
  eligibility: ReviewEligibility;
}

/** Admin moderation row — mirrors backend `ProductReview` entity (raw). */
export interface AdminReview {
  id: string;
  productId: string;
  userId: string;
  orderId: string | null;
  rating: number;
  title: string | null;
  body: string | null;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
}
