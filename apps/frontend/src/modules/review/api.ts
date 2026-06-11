import { apiFetch } from '@/lib/api/client';
import { toQueryString } from '@/lib/api/query-string';
import type { Paginated } from '@/types/api';
import type {
  AdminReview,
  MyReview,
  MyReviewResponse,
  PublicReviewList,
  ReviewStatus,
  ReviewSummary,
} from './types';

export interface CreateReviewBody {
  productId: string;
  rating: number;
  title?: string;
  body?: string;
}

export type UpdateReviewBody = Partial<Omit<CreateReviewBody, 'productId'>>;

export const reviewApi = {
  list: (productId: string, page = 1, limit = 10) =>
    apiFetch<PublicReviewList>(`/reviews/product/${productId}?page=${page}&limit=${limit}`, {
      auth: false,
    }),

  summary: (productId: string) =>
    apiFetch<ReviewSummary>(`/reviews/product/${productId}/summary`, { auth: false }),

  mine: (productId: string) => apiFetch<MyReviewResponse>(`/reviews/me/${productId}`),

  create: (body: CreateReviewBody) => apiFetch<MyReview>('/reviews', { method: 'POST', body }),

  update: (id: string, body: UpdateReviewBody) =>
    apiFetch<MyReview>(`/reviews/${id}`, { method: 'PATCH', body }),

  remove: (id: string) => apiFetch<{ deleted: true }>(`/reviews/${id}`, { method: 'DELETE' }),
};

export interface AdminListReviewParams {
  page?: number;
  limit?: number;
  status?: ReviewStatus;
  productId?: string;
}

export const adminReviewApi = {
  list: (params: AdminListReviewParams = {}) =>
    apiFetch<Paginated<AdminReview>>(`/admin/reviews${toQueryString(params)}`),

  setStatus: (id: string, status: ReviewStatus) =>
    apiFetch<AdminReview>(`/admin/reviews/${id}/status`, { method: 'PATCH', body: { status } }),

  remove: (id: string) => apiFetch<{ deleted: true }>(`/admin/reviews/${id}`, { method: 'DELETE' }),
};
