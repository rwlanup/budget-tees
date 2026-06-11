import type { Media, MediaVariantType } from './types';

/** Mirrors backend ALLOWED_IMAGE_MIME + MAX_IMAGE_BYTES (client pre-check only). */
export const ACCEPTED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
export const ACCEPT_ATTR = ACCEPTED_MIME.join(',');
export const MAX_BYTES = 5 * 1024 * 1024;

/** Resolve the best URL for a desired variant, falling back to the original. */
export function getVariantUrl(media: Media, size: MediaVariantType = 'MEDIUM'): string {
  const exact = media.variants.find((v) => v.variant === size);
  if (exact) return exact.url;
  const order: MediaVariantType[] = ['MEDIUM', 'LARGE', 'THUMB', 'WEBP'];
  for (const v of order) {
    const hit = media.variants.find((x) => x.variant === v);
    if (hit) return hit.url;
  }
  return media.url;
}

/** Client-side guard mirroring backend validation. Returns an error message or null. */
export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_MIME.includes(file.type)) {
    return 'Unsupported file type. Use JPEG, PNG, WebP, or AVIF.';
  }
  if (file.size > MAX_BYTES) {
    return 'File is too large (max 5 MB).';
  }
  return null;
}
