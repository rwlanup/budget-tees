/** Mirrors backend StorefrontService response shapes (read-only catalog). */

export interface StoreImage {
  url: string;
  alt: string | null;
  variants: { variant: string; url: string; width: number; height: number }[];
}

export interface StorefrontVariant {
  skuId: string;
  sku: string;
  name: string | null;
  productId: string;
  productName: string;
  productSlug: string;
  brand: { id: string; name: string } | null;
  categoryId: string;
  attributes: { attribute: string; value: string }[];
  attributeValueIds: string[];
  price: number;
  compareAtPrice: number | null;
  salePrice: number;
  onSale: boolean;
  discountPct: number;
  available: number;
  inStock: boolean;
  image: StoreImage | null;
}

export interface StorefrontVariantDetail {
  skuId: string;
  sku: string;
  name: string | null;
  attributeValueIds: string[];
  price: number;
  compareAtPrice: number | null;
  salePrice: number;
  onSale: boolean;
  discountPct: number;
  available: number;
  inStock: boolean;
  imageMediaId: string | null;
  image: StoreImage | null;
}

export interface StorefrontAxis {
  attributeId: string;
  name: string;
  values: { id: string; value: string; meta: unknown }[];
}

export interface StorefrontProductDetail {
  product: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    shortDescription: string | null;
    metaTitle: string | null;
    metaDescription: string | null;
    brand: { id: string; name: string } | null;
    category: { id: string; name: string; slug: string };
    tags: { id: string; name: string }[];
  };
  gallery: { mediaId: string; url: string | null; isPrimary: boolean; alt: string | null }[];
  axes: StorefrontAxis[];
  variants: StorefrontVariantDetail[];
  defaultSkuId: string | null;
}

export type CatalogSort = 'newest' | 'price_asc' | 'price_desc' | 'name';

/** Listing query params (mirrors StorefrontVariantQueryDto). */
export interface VariantListParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  brandId?: string;
  tagIds?: string[];
  attributeValueIds?: string[];
  priceMin?: number;
  priceMax?: number;
  inStock?: boolean;
  sort?: CatalogSort;
}

/** Pick the best display URL from a StoreImage (prefer MEDIUM/LARGE webp). */
export function imageUrl(
  image: StoreImage | null,
  prefer: 'MEDIUM' | 'LARGE' | 'THUMB' = 'MEDIUM',
): string | null {
  if (!image) return null;
  const v = image.variants.find((x) => x.variant === prefer);
  return v?.url ?? image.url ?? null;
}
