'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { CatalogSort, VariantListParams } from './types';

const SORTS: CatalogSort[] = ['newest', 'price_asc', 'price_desc', 'name'];
const PAGE_SIZE = 24;

/**
 * Listing state lives in the URL (shareable, back-restores). `base` carries
 * fixed params the page owns (categoryId on a category page, search on /search).
 */
export function useCatalogParams(base: Partial<VariantListParams> = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const params = React.useMemo<VariantListParams>(() => {
    const num = (k: string) => {
      const v = sp.get(k);
      return v != null && v !== '' && !Number.isNaN(Number(v)) ? Number(v) : undefined;
    };
    const sortRaw = sp.get('sort');
    return {
      ...base,
      page: num('page') ?? 1,
      limit: PAGE_SIZE,
      brandId: sp.get('brandId') ?? base.brandId,
      priceMin: num('priceMin'),
      priceMax: num('priceMax'),
      inStock: sp.get('inStock') === '1' || undefined,
      sort: (sortRaw && SORTS.includes(sortRaw as CatalogSort) ? sortRaw : undefined) as
        | CatalogSort
        | undefined,
      tagIds: sp.getAll('tagIds'),
      attributeValueIds: sp.getAll('attributeValueIds'),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp, base.categoryId, base.search, base.brandId]);

  const commit = React.useCallback(
    (next: URLSearchParams, resetPage = true) => {
      if (resetPage) next.delete('page');
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname],
  );

  const setParam = React.useCallback(
    (key: string, value: string | number | null | undefined) => {
      const next = new URLSearchParams(sp.toString());
      if (value == null || value === '') next.delete(key);
      else next.set(key, String(value));
      commit(next, key !== 'page');
    },
    [sp, commit],
  );

  const toggleArrayParam = React.useCallback(
    (key: 'tagIds' | 'attributeValueIds', id: string) => {
      const next = new URLSearchParams(sp.toString());
      const current = next.getAll(key);
      next.delete(key);
      const updated = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
      for (const v of updated) next.append(key, v);
      commit(next);
    },
    [sp, commit],
  );

  const reset = React.useCallback(() => commit(new URLSearchParams()), [commit]);

  const hasFilters =
    !!params.brandId ||
    params.priceMin != null ||
    params.priceMax != null ||
    !!params.inStock ||
    (params.tagIds?.length ?? 0) > 0 ||
    (params.attributeValueIds?.length ?? 0) > 0;

  return { params, setParam, toggleArrayParam, reset, hasFilters, pageSize: PAGE_SIZE };
}
