import type { Category } from '@/modules/category/types';
import type { Brand } from '@/modules/brand/types';
import type { Tag } from '@/modules/tag/types';

export type ProductStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type ProductType = 'SIMPLE' | 'VARIABLE';

export const PRODUCT_STATUSES: ProductStatus[] = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];
export const PRODUCT_TYPES: ProductType[] = ['SIMPLE', 'VARIABLE'];

/** Mirrors backend Product entity (category/brand/tags eager). */
export interface Product {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  categoryId: string;
  category: Category | null;
  brandId: string | null;
  brand: Brand | null;
  taxClassId: string | null;
  type: ProductType;
  status: ProductStatus;
  defaultSkuId: string | null;
  publishedAt: string | null;
  tags: Tag[];
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Gallery row from GET /products/:id/media. */
export interface ProductMediaItem {
  mediaId: string;
  sortOrder: number;
  isPrimary: boolean;
  url: string | null;
  variants: { variant: string; url: string; width: number; height: number }[];
}

/** Assignment row from GET /products/:id/attributes. */
export interface ProductAttributeAssignment {
  attributeId: string;
  name: string;
  type: string;
  isVariation: boolean;
  values: { id: string; value: string; slug: string; meta: Record<string, unknown> | null }[];
}
