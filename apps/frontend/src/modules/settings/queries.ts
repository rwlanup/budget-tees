'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  settingsApi,
  shippingCountryApi,
  type SettingItem,
  type CreateCountryBody,
  type UpdateCountryBody,
} from './api';

export const settingsKeys = {
  all: ['settings'] as const,
  list: (group?: string) => [...settingsKeys.all, 'list', group ?? 'all'] as const,
  public: ['settings', 'public'] as const,
};

export const shippingCountryKeys = {
  all: ['shipping-countries'] as const,
};

export function useSettings() {
  return useQuery({
    queryKey: settingsKeys.list(),
    queryFn: () => settingsApi.list(),
    staleTime: 60_000,
  });
}

/** Public store config (name, currency, support email…) for the storefront shell. */
export function usePublicSettings() {
  return useQuery({
    queryKey: settingsKeys.public,
    queryFn: () => settingsApi.getPublic(),
    staleTime: 5 * 60_000,
  });
}

export function useBulkUpsertSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: SettingItem[]) => settingsApi.bulkUpsert(items),
    onSuccess: () => qc.invalidateQueries({ queryKey: settingsKeys.all }),
  });
}

export function useShippingCountries() {
  return useQuery({
    queryKey: shippingCountryKeys.all,
    queryFn: () => shippingCountryApi.list(),
  });
}

/** Active shipping countries (public endpoint) — for selects in other modules. */
export function usePublicShippingCountries() {
  return useQuery({
    queryKey: [...shippingCountryKeys.all, 'public'] as const,
    queryFn: () => shippingCountryApi.listPublic(),
    staleTime: 5 * 60_000,
  });
}

export function useCreateCountry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateCountryBody) => shippingCountryApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: shippingCountryKeys.all }),
  });
}

export function useUpdateCountry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ code, body }: { code: string; body: UpdateCountryBody }) =>
      shippingCountryApi.update(code, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: shippingCountryKeys.all }),
  });
}

export function useDeleteCountry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => shippingCountryApi.remove(code),
    onSuccess: () => qc.invalidateQueries({ queryKey: shippingCountryKeys.all }),
  });
}
