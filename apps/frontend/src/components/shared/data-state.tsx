'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError } from '@/lib/api/client';

interface DataStateProps {
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  /** True when the request succeeded but returned no rows. */
  isEmpty?: boolean;
  onRetry?: () => void;
  loadingFallback?: React.ReactNode;
  emptyFallback?: React.ReactNode;
  children: React.ReactNode;
}

/** Wraps a query view: renders loading / error / empty / data consistently. */
export function DataState({
  isLoading,
  isError,
  error,
  isEmpty,
  onRetry,
  loadingFallback,
  emptyFallback,
  children,
}: DataStateProps) {
  if (isLoading) {
    return (
      <>
        {loadingFallback ?? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-2/3" />
          </div>
        )}
      </>
    );
  }

  if (isError) {
    const message =
      error instanceof ApiError ? error.messages[0] : 'Failed to load. Please try again.';
    return (
      <Alert variant="destructive" role="alert">
        <AlertCircle className="size-4" aria-hidden />
        <AlertTitle>Couldn’t load data</AlertTitle>
        <AlertDescription className="flex flex-col items-start gap-3">
          <span>{message}</span>
          {onRetry && (
            <Button size="sm" variant="outline" onClick={onRetry}>
              <RefreshCw className="size-4" aria-hidden />
              Retry
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (isEmpty) return <>{emptyFallback ?? null}</>;

  return <>{children}</>;
}
