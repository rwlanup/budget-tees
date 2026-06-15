import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { FeaturedProduct } from './entities/featured-product.entity';
import { ProductService } from '../product/product.service';
import { SkuService } from '../sku/services/sku.service';
import { SaleResolverService } from '../product-sale/services/sale-resolver.service';
import { AddFeaturedDto, ReorderFeaturedDto, UpdateFeaturedDto } from './dto/featured.dto';

@Injectable()
export class FeaturedProductService {
  constructor(
    @InjectRepository(FeaturedProduct) private readonly repo: Repository<FeaturedProduct>,
    private readonly products: ProductService,
    private readonly skus: SkuService,
    private readonly sales: SaleResolverService,
    private readonly dataSource: DataSource,
  ) {}

  /** Public: active featured entries whose product is still published, priced. */
  async listPublic() {
    const rows = await this.repo.find({ where: { isActive: true }, order: { sortOrder: 'ASC' } });

    // Batch the per-row product, default-SKU and sale lookups (was ~N queries/row).
    const products = await this.products.findPublishedByIds(rows.map((r) => r.productId));
    const productMap = new Map(products.map((p) => [p.id, p]));
    const skuMap = new Map(
      (
        await this.skus.findByIds(
          products.map((p) => p.defaultSkuId).filter((id): id is string => !!id),
        )
      ).map((s) => [s.id, s]),
    );
    const pricer = await this.sales.buildPricer(
      products.map((p) => ({ id: p.id, categoryId: p.categoryId })),
    );

    const items: Array<Record<string, unknown>> = [];
    for (const row of rows) {
      const product = productMap.get(row.productId);
      if (!product) continue;
      let basePrice = 0;
      let salePrice = 0;
      let onSale = false;
      const sku = product.defaultSkuId ? skuMap.get(product.defaultSkuId) : undefined;
      if (sku) {
        basePrice = sku.price;
        const resolved = pricer.price(product.id, sku.price);
        salePrice = resolved.salePrice;
        onSale = resolved.onSale;
      }
      items.push({
        productId: product.id,
        name: product.name,
        slug: product.slug,
        sortOrder: row.sortOrder,
        basePrice,
        salePrice,
        onSale,
      });
    }
    return items;
  }

  adminList(): Promise<FeaturedProduct[]> {
    return this.repo.find({ order: { sortOrder: 'ASC' } });
  }

  async add(dto: AddFeaturedDto, adminId?: string): Promise<FeaturedProduct> {
    await this.products.findOneByIdOrSlug(dto.productId, true); // must be published
    if (await this.repo.findOne({ where: { productId: dto.productId } })) {
      throw new ConflictException('Product already featured');
    }
    return this.repo.save(
      this.repo.create({
        productId: dto.productId,
        sortOrder: dto.sortOrder ?? 0,
        isActive: true,
        featuredAt: new Date(),
        createdBy: adminId ?? null,
      }),
    );
  }

  async update(id: string, dto: UpdateFeaturedDto): Promise<FeaturedProduct> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Featured entry not found');
    if (dto.isActive !== undefined) row.isActive = dto.isActive;
    if (dto.sortOrder !== undefined) row.sortOrder = dto.sortOrder;
    return this.repo.save(row);
  }

  async reorder(dto: ReorderFeaturedDto): Promise<{ updated: number }> {
    await this.dataSource.transaction(async (mgr) => {
      for (const item of dto.items) {
        await mgr.getRepository(FeaturedProduct).update(item.id, { sortOrder: item.sortOrder });
      }
    });
    return { updated: dto.items.length };
  }

  async remove(id: string): Promise<void> {
    const res = await this.repo.delete({ id });
    if (!res.affected) throw new NotFoundException('Featured entry not found');
  }
}
