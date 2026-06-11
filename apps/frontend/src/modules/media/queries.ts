'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { mediaApi } from './api';

export const mediaKeys = {
  all: ['media'] as const,
  detail: (id: string) => [...mediaKeys.all, id] as const,
};

export function useMedia(id: string | null | undefined) {
  return useQuery({
    queryKey: mediaKeys.detail(id ?? ''),
    queryFn: () => mediaApi.get(id as string),
    enabled: !!id,
  });
}

export function useUploadMedia() {
  return useMutation({
    mutationFn: ({ file, altText }: { file: File; altText?: string }) =>
      mediaApi.upload(file, altText),
  });
}
