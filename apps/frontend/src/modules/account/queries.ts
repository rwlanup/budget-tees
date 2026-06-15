'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authKeys } from '@/modules/auth/queries';
import { useAuthStore, type AuthUser } from '@/lib/auth/auth-store';
import { addressApi, profileApi, type AddressBody } from './api';

export const addressKeys = {
  all: ['addresses'] as const,
};

export function useAddresses() {
  const authed = !!useAuthStore((s) => s.refreshToken);
  return useQuery({
    queryKey: addressKeys.all,
    queryFn: () => addressApi.list(),
    enabled: authed,
  });
}

export function useCreateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AddressBody) => addressApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: addressKeys.all }),
  });
}

export function useUpdateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<AddressBody> }) =>
      addressApi.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: addressKeys.all }),
  });
}

export function useDeleteAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => addressApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: addressKeys.all }),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { firstName?: string; lastName?: string }) => profileApi.update(body),
    onSuccess: (user: AuthUser) => {
      useAuthStore.getState().setUser(user);
      qc.setQueryData(authKeys.me, user);
    },
  });
}

/**
 * Self-service account deactivation. The backend marks the account DEACTIVATED;
 * the session is then dead (the JWT guard rejects non-active users), so we clear
 * all local state and send the user to sign-in. Signing back in reactivates it.
 */
export function useDeactivateAccount() {
  const qc = useQueryClient();
  const router = useRouter();
  return useMutation({
    mutationFn: () => profileApi.deactivate(),
    onSuccess: () => {
      useAuthStore.getState().clear();
      qc.clear();
      router.replace('/sign-in');
    },
  });
}
