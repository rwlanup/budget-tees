export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
}

export enum MediaStatus {
  PROCESSING = 'PROCESSING',
  READY = 'READY',
  FAILED = 'FAILED',
}

export enum MediaVariantType {
  THUMB = 'THUMB',
  MEDIUM = 'MEDIUM',
  LARGE = 'LARGE',
  WEBP = 'WEBP',
}

/** Target widths (px) per image variant. */
export const VARIANT_WIDTHS: Record<MediaVariantType, number> = {
  [MediaVariantType.THUMB]: 150,
  [MediaVariantType.MEDIUM]: 600,
  [MediaVariantType.LARGE]: 1200,
  [MediaVariantType.WEBP]: 1200,
};
