import { apiFetch } from '@/lib/api/client';
import type { Attribute, AttributeType, AttributeValue } from './types';

export interface AttributeBody {
  name: string;
  slug?: string;
  type?: AttributeType;
  isVariation?: boolean;
  isFilterable?: boolean;
  sortOrder?: number;
}

export interface ValueBody {
  value: string;
  slug?: string;
  meta?: Record<string, unknown>;
  sortOrder?: number;
}

export const attributeApi = {
  list: () => apiFetch<Attribute[]>('/attributes'),
  get: (idOrSlug: string) => apiFetch<Attribute>(`/attributes/${idOrSlug}`),
  create: (body: AttributeBody) => apiFetch<Attribute>('/attributes', { method: 'POST', body }),
  update: (id: string, body: Omit<AttributeBody, 'type'>) =>
    apiFetch<Attribute>(`/attributes/${id}`, { method: 'PATCH', body }),
  remove: (id: string) => apiFetch<{ deleted: boolean }>(`/attributes/${id}`, { method: 'DELETE' }),

  addValue: (id: string, body: ValueBody) =>
    apiFetch<AttributeValue>(`/attributes/${id}/values`, { method: 'POST', body }),
  updateValue: (id: string, valueId: string, body: ValueBody) =>
    apiFetch<AttributeValue>(`/attributes/${id}/values/${valueId}`, { method: 'PATCH', body }),
  removeValue: (id: string, valueId: string) =>
    apiFetch<{ deleted: boolean }>(`/attributes/${id}/values/${valueId}`, { method: 'DELETE' }),
};
