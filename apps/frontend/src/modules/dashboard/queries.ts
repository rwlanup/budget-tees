'use client';

import { useQuery } from '@tanstack/react-query';
import { orderApi } from '@/modules/order/api';
import { returnApi } from '@/modules/return/api';
import { skuApi } from '@/modules/sku/api';
import type { OrderStatus } from '@/modules/order/types';

/** Count of orders matching a status (reads `.total` from a 1-row query). */
export function useOrderCount(status?: OrderStatus) {
  return useQuery({
    queryKey: ['dashboard', 'order-count', status ?? 'all'] as const,
    queryFn: () => orderApi.list({ status, limit: 1 }),
    select: (d) => d.total,
    staleTime: 30_000,
  });
}

/** Count of returns matching a status. */
export function useReturnCount(status?: string) {
  return useQuery({
    queryKey: ['dashboard', 'return-count', status ?? 'all'] as const,
    queryFn: () => returnApi.list({ status, limit: 1 }),
    select: (d) => d.total,
    staleTime: 30_000,
  });
}

/** Most recent orders for the dashboard table. */
export function useRecentOrders(limit = 6) {
  return useQuery({
    queryKey: ['dashboard', 'recent-orders', limit] as const,
    queryFn: () => orderApi.list({ page: 1, limit }),
    select: (d) => d.items,
    staleTime: 30_000,
  });
}

/** Low-stock variants (also used for the count card). */
export function useLowStockSkus() {
  return useQuery({
    queryKey: ['dashboard', 'low-stock'] as const,
    queryFn: () => skuApi.lowStock(),
    staleTime: 30_000,
  });
}
