'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pickupApi, zoneApi, type PickupBody, type ZoneBody } from './api';

export const locationKeys = {
  pickups: ['location', 'pickups'] as const,
  zones: ['location', 'zones'] as const,
};

export function usePickups() {
  return useQuery({ queryKey: locationKeys.pickups, queryFn: () => pickupApi.list() });
}

export function useCreatePickup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: PickupBody) => pickupApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: locationKeys.pickups }),
  });
}

export function useUpdatePickup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<PickupBody> }) =>
      pickupApi.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: locationKeys.pickups }),
  });
}

export function useDeletePickup() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pickupApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: locationKeys.pickups }),
  });
}

export function useZones() {
  return useQuery({ queryKey: locationKeys.zones, queryFn: () => zoneApi.list() });
}

export function useCreateZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ZoneBody) => zoneApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: locationKeys.zones }),
  });
}

export function useUpdateZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<ZoneBody> }) => zoneApi.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: locationKeys.zones }),
  });
}

export function useDeleteZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => zoneApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: locationKeys.zones }),
  });
}
