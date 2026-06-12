import { apiFetch } from '@/lib/api/client';
import { toQueryString } from '@/lib/api/query-string';
import type { ContactMessage, ContactMessageList, ContactStatus, ContactTopic } from './types';

export interface CreateContactBody {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  topic: ContactTopic;
  message: string;
}

export const contactApi = {
  create: (body: CreateContactBody) =>
    apiFetch<ContactMessage>('/contact-messages', { method: 'POST', body }),
};

export interface AdminListContactParams {
  page?: number;
  limit?: number;
  status?: ContactStatus;
  topic?: ContactTopic;
}

export const adminContactApi = {
  list: (params: AdminListContactParams = {}) =>
    apiFetch<ContactMessageList>(`/admin/contact-messages${toQueryString(params)}`),

  pendingCount: () => apiFetch<{ count: number }>('/admin/contact-messages/pending-count'),

  setStatus: (id: string, status: ContactStatus) =>
    apiFetch<ContactMessage>(`/admin/contact-messages/${id}/status`, {
      method: 'PATCH',
      body: { status },
    }),
};
