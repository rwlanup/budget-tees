import { apiFetch } from '@/lib/api/client';
import type { Paginated } from '@/types/api';
import type { StorefrontProductDetail, StorefrontVariant, VariantListParams } from './types';

/** Serialize listing params — arrays become repeated keys (Nest parses to string[]). */
function serialize(params: VariantListParams): string {
  const sp = new URLSearchParams();
  const set = (k: string, v: unknown) => {
    if (v === undefined || v === null || v === '') return;
    sp.append(k, String(v));
  };
  set('page', params.page);
  set('limit', params.limit);
  set('search', params.search);
  set('categoryId', params.categoryId);
  set('brandId', params.brandId);
  set('priceMin', params.priceMin);
  set('priceMax', params.priceMax);
  if (params.inStock) set('inStock', true);
  set('sort', params.sort);
  for (const id of params.tagIds ?? []) sp.append('tagIds', id);
  for (const id of params.attributeValueIds ?? []) sp.append('attributeValueIds', id);
  const qs = sp.toString();
  return qs ? `?${qs}` : '';
}

export const catalogApi = {
  variants: (params: VariantListParams) =>
    apiFetch<Paginated<StorefrontVariant>>(`/storefront/variants${serialize(params)}`, {
      auth: false,
    }),

  productDetail: (idOrSlug: string) =>
    apiFetch<StorefrontProductDetail>(`/storefront/products/${idOrSlug}`, { auth: false }),

  productMedia: (productId: string) =>
    apiFetch<ProductMediaItem[]>(`/products/${productId}/media`, { auth: false }),

  featured: () => apiFetch<FeaturedItem[]>('/featured-products', { auth: false }),
};

export interface FeaturedItem {
  productId: string;
  name: string;
  slug: string;
  sortOrder: number;
  basePrice: number;
  salePrice: number;
  onSale: boolean;
}

export interface ProductMediaItem {
  mediaId: string;
  sortOrder: number;
  isPrimary: boolean;
  url: string | null;
  variants: { variant: string; url: string; width: number; height: number }[];
}
