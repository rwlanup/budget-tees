'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  taxClassApi,
  taxRateApi,
  type CreateClassBody,
  type UpdateClassBody,
  type RateFilters,
  type CreateRateBody,
  type UpdateRateBody,
} from './api';

export const taxKeys = {
  all: ['tax'] as const,
  classes: ['tax', 'classes'] as const,
  rates: (filters: RateFilters) => ['tax', 'rates', filters] as const,
};

export function useTaxClasses() {
  return useQuery({ queryKey: taxKeys.classes, queryFn: () => taxClassApi.list() });
}

export function useCreateClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateClassBody) => taxClassApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: taxKeys.all }),
  });
}

export function useUpdateClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateClassBody }) =>
      taxClassApi.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: taxKeys.all }),
  });
}

export function useDeleteClass() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => taxClassApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: taxKeys.all }),
  });
}

export function useTaxRates(filters: RateFilters) {
  return useQuery({
    queryKey: taxKeys.rates(filters),
    queryFn: () => taxRateApi.list(filters),
    placeholderData: (prev) => prev,
  });
}

export function useCreateRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateRateBody) => taxRateApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tax', 'rates'] }),
  });
}

export function useUpdateRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateRateBody }) => taxRateApi.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tax', 'rates'] }),
  });
}

export function useDeleteRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => taxRateApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tax', 'rates'] }),
  });
}
