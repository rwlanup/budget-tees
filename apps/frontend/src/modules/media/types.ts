export type MediaStatus = 'PROCESSING' | 'READY' | 'FAILED';
export type MediaVariantType = 'THUMB' | 'MEDIUM' | 'LARGE' | 'WEBP';

export interface MediaVariant {
  id: string;
  mediaId: string;
  variant: MediaVariantType;
  url: string;
  width: number;
  height: number;
  sizeBytes: string;
}

/** Mirrors backend Media entity (variants eager). */
export interface Media {
  id: string;
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  originalName: string;
  mimeType: string;
  sizeBytes: string;
  url: string;
  width: number | null;
  height: number | null;
  altText: string | null;
  status: MediaStatus;
  variants: MediaVariant[];
  createdAt: string;
  updatedAt: string;
}
