import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { ProductMedia } from './entities/product-media.entity';
import { MediaService } from '../media/services/media.service';
import { SetProductMediaDto } from './dto/set-media.dto';

@Injectable()
export class ProductMediaService {
  constructor(
    @InjectRepository(ProductMedia) private readonly repo: Repository<ProductMedia>,
    private readonly media: MediaService,
    private readonly dataSource: DataSource,
  ) {}

  async getGallery(productId: string) {
    const rows = await this.repo.find({
      where: { productId },
      order: { sortOrder: 'ASC' },
    });
    const result: Array<{
      mediaId: string;
      sortOrder: number;
      isPrimary: boolean;
      url: string | null;
      variants: unknown[];
    }> = [];
    for (const row of rows) {
      const m = await this.media.findOne(row.mediaId).catch(() => null);
      result.push({
        mediaId: row.mediaId,
        sortOrder: row.sortOrder,
        isPrimary: row.isPrimary,
        url: m?.url ?? null,
        variants: m?.variants ?? [],
      });
    }
    return result;
  }

  async getPrimaryMedia(productId: string) {
    const row = await this.repo.findOne({
      where: { productId, isPrimary: true },
    });

    if (!row) return null;
    const m = await this.media.findOne(row.mediaId).catch(() => null);
    if (!m) return null;
    return {
      mediaId: row.mediaId,
      sortOrder: row.sortOrder,
      isPrimary: row.isPrimary,
      url: m.url,
    };
  }

  /**
   * Batch counterpart to `getPrimaryMedia` for many products: maps each product
   * id to its primary media URL in two queries (primary rows + media), instead
   * of one round-trip per product. Same semantics — strictly the `isPrimary`
   * row (no first-row fallback); a missing primary row or media yields no entry
   * (callers treat absent as null).
   */
  async primaryMediaUrlByProduct(productIds: string[]): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    if (!productIds.length) return map;
    const rows = await this.repo.find({ where: { productId: In(productIds), isPrimary: true } });
    if (!rows.length) return map;
    const urlByMediaId = new Map(
      (await this.media.findManyByIds(rows.map((r) => r.mediaId))).map((m) => [m.id, m.url]),
    );
    for (const r of rows) {
      const url = urlByMediaId.get(r.mediaId);
      if (url != null) map.set(r.productId, url);
    }
    return map;
  }

  /** Replace the full gallery in one transaction; enforces exactly one primary. */
  async setGallery(productId: string, dto: SetProductMediaDto) {
    if (dto.items.length) {
      const primaries = dto.items.filter((i) => i.isPrimary).length;
      if (primaries > 1) throw new BadRequestException('Only one media can be primary');
      for (const item of dto.items) await this.media.assertReady(item.mediaId);
    }
    await this.dataSource.transaction(async (mgr) => {
      const repo = mgr.getRepository(ProductMedia);
      await repo.delete({ productId });
      const rows = dto.items.map((item, idx) =>
        repo.create({
          productId,
          mediaId: item.mediaId,
          sortOrder: item.sortOrder,
          isPrimary: item.isPrimary ?? (idx === 0 && dto.items.every((i) => !i.isPrimary)),
        }),
      );
      if (rows.length) await repo.save(rows);
    });
    return this.getGallery(productId);
  }
}
