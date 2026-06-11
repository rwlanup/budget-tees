/** Mirrors backend FeaturedProduct entity (admin list returns raw rows). */
export interface FeaturedProduct {
  id: string;
  productId: string;
  sortOrder: number;
  isActive: boolean;
  featuredAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}
