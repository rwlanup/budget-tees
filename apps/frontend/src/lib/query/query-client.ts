import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/api/client';

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          // Never retry client errors (4xx); retry transient errors once.
          if (error instanceof ApiError && error.statusCode < 500) return false;
          return failureCount < 1;
        },
      },
      mutations: {
        retry: false,
      },
    },
  });
}
