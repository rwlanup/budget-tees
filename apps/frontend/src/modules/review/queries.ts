'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useIsAuthed } from '@/modules/wishlist/queries';
import {
  adminReviewApi,
  reviewApi,
  type AdminListReviewParams,
  type CreateReviewBody,
  type UpdateReviewBody,
} from './api';
import type { ReviewStatus } from './types';

export const reviewKeys = {
  all: ['reviews'] as const,
  summary: (productId: string) => ['reviews', 'summary', productId] as const,
  list: (productId: string, page: number) => ['reviews', 'list', productId, page] as const,
  mine: (productId: string) => ['reviews', 'mine', productId] as const,
};

export function useReviewSummary(productId: string, enabled = true) {
  return useQuery({
    queryKey: reviewKeys.summary(productId),
    queryFn: () => reviewApi.summary(productId),
    enabled: enabled && !!productId,
    staleTime: 60_000,
  });
}

export function useProductReviews(productId: string, page = 1) {
  return useQuery({
    queryKey: reviewKeys.list(productId, page),
    queryFn: () => reviewApi.list(productId, page),
    enabled: !!productId,
    staleTime: 30_000,
  });
}

/** Caller's own review + eligibility (auth only). */
export function useMyReview(productId: string) {
  const authed = useIsAuthed();
  return useQuery({
    queryKey: reviewKeys.mine(productId),
    queryFn: () => reviewApi.mine(productId),
    enabled: authed && !!productId,
    staleTime: 30_000,
  });
}

function invalidateProduct(qc: ReturnType<typeof useQueryClient>, productId: string) {
  qc.invalidateQueries({ queryKey: reviewKeys.mine(productId) });
  qc.invalidateQueries({ queryKey: reviewKeys.summary(productId) });
  qc.invalidateQueries({ queryKey: ['reviews', 'list', productId] });
}

export function useCreateReview(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateReviewBody) => reviewApi.create(body),
    onSuccess: () => invalidateProduct(qc, productId),
  });
}

export function useUpdateReview(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateReviewBody }) =>
      reviewApi.update(id, body),
    onSuccess: () => invalidateProduct(qc, productId),
  });
}

export function useDeleteReview(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reviewApi.remove(id),
    onSuccess: () => invalidateProduct(qc, productId),
  });
}

// ----- Admin moderation (review.manage) -----

export const adminReviewKeys = {
  all: ['admin-reviews'] as const,
  list: (params: AdminListReviewParams) => [...adminReviewKeys.all, params] as const,
};

export function useAdminReviews(params: AdminListReviewParams) {
  return useQuery({
    queryKey: adminReviewKeys.list(params),
    queryFn: () => adminReviewApi.list(params),
    placeholderData: (prev) => prev,
  });
}

export function useSetReviewStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ReviewStatus }) =>
      adminReviewApi.setStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminReviewKeys.all }),
  });
}

export function useAdminDeleteReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminReviewApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminReviewKeys.all }),
  });
}
