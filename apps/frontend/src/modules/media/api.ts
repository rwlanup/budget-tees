import { apiFetch } from '@/lib/api/client';
import type { Media } from './types';

export const mediaApi = {
  upload: (file: File, altText?: string) => {
    const form = new FormData();
    form.append('file', file);
    if (altText) form.append('altText', altText);
    return apiFetch<Media>('/media', { method: 'POST', body: form });
  },

  get: (id: string) => apiFetch<Media>(`/media/${id}`),
};
