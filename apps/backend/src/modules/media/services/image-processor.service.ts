import { BadRequestException, Injectable } from '@nestjs/common';
import sharp from 'sharp';
import { MediaVariantType, VARIANT_WIDTHS } from '../enums/media.enums';

export interface ProcessedVariant {
  variant: MediaVariantType;
  buffer: Buffer;
  width: number;
  height: number;
  contentType: string;
}

export interface ProcessedImage {
  width: number;
  height: number;
  original: { buffer: Buffer; contentType: string; ext: string };
  variants: ProcessedVariant[];
}

const MAX_DIMENSION = 6000; // decompression-bomb guard

@Injectable()
export class ImageProcessorService {
  /**
   * Validate (real image via sharp), strip metadata, auto-orient, and emit
   * webp variants (thumb/medium/large). Throws on non-images / dimension bombs.
   */
  async process(input: Buffer): Promise<ProcessedImage> {
    let meta: sharp.Metadata;
    try {
      meta = await sharp(input).metadata();
    } catch {
      throw new BadRequestException('File is not a valid image');
    }
    if (!meta.width || !meta.height) throw new BadRequestException('Unreadable image dimensions');
    if (meta.width > MAX_DIMENSION || meta.height > MAX_DIMENSION) {
      throw new BadRequestException('Image dimensions exceed allowed maximum');
    }

    // Normalised original (auto-oriented, metadata stripped).
    const originalBuffer = await sharp(input).rotate().toBuffer();
    const base = sharp(originalBuffer).rotate();

    const variants: ProcessedVariant[] = [];
    for (const variant of [
      MediaVariantType.THUMB,
      MediaVariantType.MEDIUM,
      MediaVariantType.LARGE,
    ]) {
      const width = VARIANT_WIDTHS[variant];
      const out = await base
        .clone()
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer({ resolveWithObject: true });
      variants.push({
        variant,
        buffer: out.data,
        width: out.info.width,
        height: out.info.height,
        contentType: 'image/webp',
      });
    }

    return {
      width: meta.width,
      height: meta.height,
      original: {
        buffer: originalBuffer,
        contentType: `image/${meta.format}`,
        ext: meta.format ?? 'bin',
      },
      variants,
    };
  }
}
