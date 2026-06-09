import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { Media } from '../entities/media.entity';
import { MediaVariant } from '../entities/media-variant.entity';
import { MediaStatus, MediaType } from '../enums/media.enums';
import { ImageProcessorService } from './image-processor.service';
import { STORAGE_DRIVER, StorageDriver } from '../storage/storage.interface';

const ALLOWED_IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export interface UploadedFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    @InjectRepository(Media) private readonly mediaRepo: Repository<Media>,
    @InjectRepository(MediaVariant) private readonly variantRepo: Repository<MediaVariant>,
    private readonly processor: ImageProcessorService,
    @Inject(STORAGE_DRIVER) private readonly storage: StorageDriver,
  ) {}

  async upload(file: UploadedFile, altText: string | undefined, userId?: string): Promise<Media> {
    if (!file) throw new BadRequestException('No file uploaded');
    if (!ALLOWED_IMAGE_MIME.includes(file.mimetype)) {
      throw new BadRequestException(`Unsupported file type: ${file.mimetype}`);
    }
    if (file.size > MAX_IMAGE_BYTES) {
      throw new BadRequestException('File exceeds 5MB limit');
    }

    // Persist a PROCESSING row first to obtain the id used in storage keys.
    let media = await this.mediaRepo.save(
      this.mediaRepo.create({
        type: MediaType.IMAGE,
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: String(file.size),
        storageKey: '',
        url: '',
        altText: altText ?? null,
        driver: this.storage.name,
        status: MediaStatus.PROCESSING,
        uploadedBy: userId ?? null,
        variants: [],
      }),
    );

    const storedKeys: string[] = [];
    try {
      const processed = await this.processor.process(file.buffer);
      const prefix = `media/${media.id}`;

      const originalKey = `${prefix}/original.${processed.original.ext}`;
      const originalUrl = await this.storage.put(
        originalKey,
        processed.original.buffer,
        processed.original.contentType,
      );
      storedKeys.push(originalKey);

      const variants: MediaVariant[] = [];
      for (const v of processed.variants) {
        const key = `${prefix}/${v.variant.toLowerCase()}.webp`;
        const url = await this.storage.put(key, v.buffer, v.contentType);
        storedKeys.push(key);
        variants.push(
          this.variantRepo.create({
            mediaId: media.id,
            variant: v.variant,
            storageKey: key,
            url,
            width: v.width,
            height: v.height,
            sizeBytes: String(v.buffer.length),
          }),
        );
      }
      await this.variantRepo.save(variants);

      media.storageKey = originalKey;
      media.url = originalUrl;
      media.width = processed.width;
      media.height = processed.height;
      media.status = MediaStatus.READY;
      media = await this.mediaRepo.save(media);
      media.variants = variants;
      return media;
    } catch (err) {
      media.status = MediaStatus.FAILED;
      await this.mediaRepo.save(media);
      await Promise.allSettled(storedKeys.map((k) => this.storage.delete(k)));
      this.logger.error(`Media processing failed for ${media.id}`, err as Error);
      if (err instanceof BadRequestException) throw err;
      throw new BadRequestException('Failed to process upload');
    }
  }

  async findOne(id: string): Promise<Media> {
    const media = await this.mediaRepo.findOne({ where: { id } });
    if (!media) throw new NotFoundException('Media not found');
    return media;
  }

  async updateAlt(id: string, altText?: string): Promise<Media> {
    const media = await this.findOne(id);
    media.altText = altText ?? null;
    return this.mediaRepo.save(media);
  }

  async remove(id: string): Promise<void> {
    const media = await this.findOne(id);
    const keys = [media.storageKey, ...media.variants.map((v) => v.storageKey)];
    try {
      await this.mediaRepo.remove(media); // cascades media_variants
    } catch (err) {
      if (err instanceof QueryFailedError && (err as unknown as { code?: string }).code === '23503') {
        throw new ConflictException('Media is referenced and cannot be deleted');
      }
      throw err;
    }
    await Promise.allSettled(keys.map((k) => this.storage.delete(k)));
  }

  /** Used by consuming modules to validate a media id is usable (exists + READY). */
  async assertReady(id: string): Promise<Media> {
    const media = await this.findOne(id);
    if (media.status !== MediaStatus.READY) {
      throw new BadRequestException('Media is not ready');
    }
    return media;
  }
}
