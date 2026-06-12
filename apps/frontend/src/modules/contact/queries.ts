'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  adminContactApi,
  contactApi,
  type AdminListContactParams,
  type CreateContactBody,
} from './api';
import type { ContactStatus } from './types';

export function useSendContactMessage() {
  return useMutation({
    mutationFn: (body: CreateContactBody) => contactApi.create(body),
  });
}

// ----- Admin (contact.manage) -----

export const adminContactKeys = {
  all: ['admin-contact-messages'] as const,
  list: (params: AdminListContactParams) => [...adminContactKeys.all, params] as const,
  pendingCount: ['admin-contact-messages', 'pending-count'] as const,
};

export function useAdminContactMessages(params: AdminListContactParams) {
  return useQuery({
    queryKey: adminContactKeys.list(params),
    queryFn: () => adminContactApi.list(params),
    placeholderData: (prev) => prev,
  });
}

/** Count of PENDING contact messages — for the admin sidebar badge. */
export function useContactPendingCount() {
  return useQuery({
    queryKey: adminContactKeys.pendingCount,
    queryFn: () => adminContactApi.pendingCount(),
  });
}

export function useSetContactStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ContactStatus }) =>
      adminContactApi.setStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: adminContactKeys.all }),
  });
}
