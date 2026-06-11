'use client';

import { AlertCircle, ChevronLeft, ChevronRight, PackageOpen, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { CatalogFilters } from './catalog-filters';
import { CatalogToolbar } from './catalog-toolbar';
import { ActiveFilters } from './active-filters';
import { VariantGrid } from './variant-grid';
import { useVariants } from '@/modules/catalog/queries';
import { useCatalogParams } from '@/modules/catalog/use-catalog-params';
import type { VariantListParams } from '@/modules/catalog/types';

/** Reusable listing surface: filters + toolbar + variant grid + pagination, URL-driven. */
export function CatalogView({ base = {} }: { base?: Partial<VariantListParams> }) {
  const ctl = useCatalogParams(base);
  const { data, isLoading, isError, refetch } = useVariants(ctl.params);

  const variants = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const page = ctl.params.page ?? 1;
  const isEmpty = !isLoading && !isError && variants.length === 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
      <aside className="hidden lg:block">
        <CatalogFilters ctl={ctl} />
      </aside>

      <div>
        <CatalogToolbar ctl={ctl} total={total} isLoading={isLoading} />
        <ActiveFilters ctl={ctl} />

        {isError ? (
          <Alert variant="destructive" role="alert">
            <AlertCircle className="size-4" aria-hidden />
            <AlertTitle>Couldn’t load products</AlertTitle>
            <AlertDescription className="flex flex-col items-start gap-3">
              <span>Please try again.</span>
              <Button size="sm" variant="outline" onClick={() => refetch()}>
                <RefreshCw className="size-4" aria-hidden />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        ) : isEmpty ? (
          <EmptyState
            icon={PackageOpen}
            title="No products found"
            description={
              ctl.hasFilters ? 'Try removing some filters.' : 'Nothing here yet — check back soon.'
            }
            action={
              ctl.hasFilters ? (
                <Button variant="outline" onClick={ctl.reset}>
                  Clear filters
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <VariantGrid variants={variants} isLoading={isLoading} skeletonCount={ctl.pageSize} />
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => ctl.setParam('page', page - 1)}
                >
                  <ChevronLeft className="size-4" aria-hidden />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground tabular-nums">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => ctl.setParam('page', page + 1)}
                >
                  Next
                  <ChevronRight className="size-4" aria-hidden />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
