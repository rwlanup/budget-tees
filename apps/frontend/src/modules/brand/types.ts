import type { Media } from '../media/types';

/** Mirrors backend Brand entity. */
export interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoMediaId: string | null;
  /** Resolved logo media for `logoMediaId`, eager-loaded on reads (null when unset). */
  logo?: Media | null;
  websiteUrl: string | null;
  isActive: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: string;
  updatedAt: string;
}
