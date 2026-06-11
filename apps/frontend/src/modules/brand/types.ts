/** Mirrors backend Brand entity. */
export interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoMediaId: string | null;
  websiteUrl: string | null;
  isActive: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: string;
  updatedAt: string;
}
