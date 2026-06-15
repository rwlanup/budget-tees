import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository } from 'typeorm';
import { PaginatedResult, paginate } from '../../common/dto/pagination.dto';
import { Sku } from '../sku/entities/sku.entity';
import { SkuAttributeValue } from '../sku/entities/sku-attribute-value.entity';
import { Product } from '../product/entities/product.entity';
import { ProductMedia } from '../product/entities/product-media.entity';
import { ProductStatus, ProductType } from '../product/enums/product.enums';
import { AttributeValue } from '../attribute/entities/attribute-value.entity';
import { Attribute } from '../attribute/entities/attribute.entity';
import { Tag } from '../tag/entities/tag.entity';
import { ProductService } from '../product/product.service';
import { CategoryService } from '../category/category.service';
import { ProductAttributeService } from '../attribute/services/product-attribute.service';
import { SaleResolverService } from '../product-sale/services/sale-resolver.service';
import { MediaService } from '../media/services/media.service';
import { StorefrontVariantQueryDto } from './dto/storefront.dto';

export interface StoreImage {
  url: string;
  alt: string | null;
  variants: { variant: string; url: string; width: number; height: number }[];
}

export interface StorefrontVariant {
  skuId: string;
  sku: string;
  name: string | null;
  productId: string;
  productName: string;
  productSlug: string;
  brand: { id: string; name: string } | null;
  categoryId: string;
  attributes: { attribute: string; value: string }[];
  attributeValueIds: string[];
  price: number;
  compareAtPrice: number | null;
  salePrice: number;
  onSale: boolean;
  discountPct: number;
  available: number;
  inStock: boolean;
  image: StoreImage | null;
}

export interface StorefrontVariantDetail {
  skuId: string;
  sku: string;
  name: string | null;
  attributeValueIds: string[];
  price: number;
  compareAtPrice: number | null;
  salePrice: number;
  onSale: boolean;
  discountPct: number;
  available: number;
  inStock: boolean;
  imageMediaId: string | null;
  image: StoreImage | null;
}

export interface TopTag {
  id: string;
  name: string;
  slug: string;
  productCount: number;
}

export interface StorefrontProductDetail {
  product: {
    id: string;
    name: string;
    slug: string;
    type: ProductType;
    description: string | null;
    shortDescription: string | null;
    metaTitle: string | null;
    metaDescription: string | null;
    brand: { id: string; name: string } | null;
    category: { id: string; name: string; slug: string };
    tags: { id: string; name: string }[];
  };
  gallery: { mediaId: string; url: string | null; isPrimary: boolean; alt: string | null }[];
  axes: {
    attributeId: string;
    name: string;
    values: { id: string; value: string; meta: unknown }[];
  }[];
  /** All attributes assigned to the product (variation + fixed specs). */
  attributes: {
    attributeId: string;
    name: string;
    isVariation: boolean;
    values: { id: string; value: string }[];
  }[];
  variants: StorefrontVariantDetail[];
  defaultSkuId: string | null;
}

@Injectable()
export class StorefrontService {
  constructor(
    @InjectRepository(Sku) private readonly skuRepo: Repository<Sku>,
    @InjectRepository(SkuAttributeValue) private readonly savRepo: Repository<SkuAttributeValue>,
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductMedia) private readonly productMediaRepo: Repository<ProductMedia>,
    @InjectRepository(AttributeValue) private readonly valueRepo: Repository<AttributeValue>,
    @InjectRepository(Attribute) private readonly attrRepo: Repository<Attribute>,
    @InjectRepository(Tag) private readonly tagRepo: Repository<Tag>,
    private readonly products: ProductService,
    private readonly categories: CategoryService,
    private readonly productAttributes: ProductAttributeService,
    private readonly sales: SaleResolverService,
    private readonly media: MediaService,
  ) {}

  // ---------- variant listing ----------

  async listVariants(q: StorefrontVariantQueryDto): Promise<PaginatedResult<StorefrontVariant>> {
    const qb = this.skuRepo
      .createQueryBuilder('s')
      .innerJoin('s.product', 'p')
      .where('s."isActive" = true')
      .andWhere('p."status" = :pub', { pub: ProductStatus.PUBLISHED })
      .andWhere('p."deletedAt" IS NULL');

    if (q.categoryId) {
      const ids = [q.categoryId, ...(await this.categories.descendantIds(q.categoryId))];
      qb.andWhere('p."categoryId" IN (:...cids)', { cids: ids });
    }
    if (q.brandId) qb.andWhere('p."brandId" = :bid', { bid: q.brandId });
    if (q.search) {
      // Match the term against product name, brand, category, or any product tag (OR).
      qb.leftJoin('p.brand', 'b').leftJoin('p.category', 'cat');
      qb.andWhere(
        new Brackets((w) => {
          w.where('p."name" ILIKE :q')
            .orWhere('b."name" ILIKE :q')
            .orWhere('cat."name" ILIKE :q')
            .orWhere(
              'EXISTS (SELECT 1 FROM product_tags pt JOIN tags t ON t."id" = pt."tagId" WHERE pt."productId" = p."id" AND t."name" ILIKE :q)',
            );
        }),
        { q: `%${q.search}%` },
      );
    }
    if (q.tagIds?.length) {
      qb.andWhere(
        'EXISTS (SELECT 1 FROM product_tags pt WHERE pt."productId" = p."id" AND pt."tagId" IN (:...tids))',
        { tids: q.tagIds },
      );
    }
    if (q.attributeValueIds?.length) {
      qb.andWhere(
        'EXISTS (SELECT 1 FROM sku_attribute_values sav WHERE sav."skuId" = s."id" AND sav."attributeValueId" IN (:...avids))',
        { avids: q.attributeValueIds },
      );
    }
    if (q.priceMin != null) qb.andWhere('s."price" >= :pmin', { pmin: q.priceMin });
    if (q.priceMax != null) qb.andWhere('s."price" <= :pmax', { pmax: q.priceMax });
    if (q.inStock) qb.andWhere('(s."stock" - s."reserved") > 0');

    // For price sorts, order by the effective (sale-aware) price computed in SQL
    // so sorting reflects active store/category/product sales — not the raw SKU
    // price. Pagination stays at the DB level (no loading all SKUs). Falls back
    // to the base price column when no sales are active.
    const priceExpr =
      q.sort === 'price_asc' || q.sort === 'price_desc'
        ? await this.sales.buildPriceSortExpression({
            basePrice: 's."price"',
            productId: 'p."id"',
            categoryId: 'p."categoryId"',
          })
        : null;

    switch (q.sort) {
      case 'price_asc':
      case 'price_desc': {
        const dir = q.sort === 'price_asc' ? 'ASC' : 'DESC';
        if (priceExpr) {
          qb.addSelect(priceExpr.sql, 'effective_price').setParameters(priceExpr.params);
          qb.orderBy('effective_price', dir);
        } else {
          qb.orderBy('s.price', dir);
        }
        break;
      }
      case 'name':
        qb.orderBy('s.name', 'ASC');
        break;
      default:
        qb.orderBy('s.createdAt', 'DESC');
    }
    qb.addOrderBy('s.id', 'ASC');
    qb.skip(q.skip).take(q.limit);

    const [skus, total] = await qb.getManyAndCount();
    const items = await this.assembleVariants(skus);
    return paginate(items, total, q.page, q.limit);
  }

  /**
   * Active tags ranked by how many in-stock, published products carry them.
   * "Available" = published, non-deleted product with ≥1 active SKU that has
   * available stock. Used for homepage quick links.
   */
  async topTags(limit = 4): Promise<TopTag[]> {
    const rows = await this.tagRepo
      .createQueryBuilder('t')
      .innerJoin('product_tags', 'pt', 'pt."tagId" = t.id')
      .innerJoin(
        Product,
        'p',
        'p.id = pt."productId" AND p."status" = :pub AND p."deletedAt" IS NULL',
        { pub: ProductStatus.PUBLISHED },
      )
      .innerJoin(
        Sku,
        's',
        's."productId" = p.id AND s."isActive" = true AND (s."stock" - s."reserved") > 0',
      )
      .where('t."isActive" = true')
      .select('t.id', 'id')
      .addSelect('t.name', 'name')
      .addSelect('t.slug', 'slug')
      .addSelect('COUNT(DISTINCT p.id)', 'productCount')
      .groupBy('t.id')
      .orderBy('"productCount"', 'DESC')
      .addOrderBy('t.name', 'ASC')
      .limit(limit)
      .getRawMany<{ id: string; name: string; slug: string; productCount: string }>();

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      productCount: Number(r.productCount),
    }));
  }

  private async assembleVariants(skus: Sku[]): Promise<StorefrontVariant[]> {
    if (!skus.length) return [];
    const productIds = [...new Set(skus.map((s) => s.productId))];
    const skuIds = skus.map((s) => s.id);

    const products = await this.productRepo.find({ where: { id: In(productIds) } });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const comboMap = await this.combosBySku(skuIds);
    const valueLabels = await this.valueLabels([...new Set([...comboMap.values()].flat())]);
    const primaryMedia = await this.primaryMediaByProduct(productIds);

    // Resolve sale prices for all products in one batch, and prefetch every
    // image in one query — replaces the previous per-SKU sale + per-media calls.
    const pricer = await this.sales.buildPricer(
      products.map((p) => ({ id: p.id, categoryId: p.categoryId })),
    );
    const imageCache = await this.loadImages(
      skus.map((s) => s.imageMediaId ?? primaryMedia.get(s.productId) ?? null),
    );

    const out: StorefrontVariant[] = [];
    for (const s of skus) {
      const p = productMap.get(s.productId);
      if (!p) continue;
      const valueIds = comboMap.get(s.id) ?? [];
      const resolved = pricer.price(p.id, s.price);
      const mediaId = s.imageMediaId ?? primaryMedia.get(s.productId) ?? null;
      const image = mediaId ? (imageCache.get(mediaId) ?? null) : null;
      const available = s.stock - s.reserved;
      out.push({
        skuId: s.id,
        sku: s.sku,
        name: s.name,
        productId: p.id,
        productName: p.name,
        productSlug: p.slug,
        brand: p.brand ? { id: p.brand.id, name: p.brand.name } : null,
        categoryId: p.categoryId,
        attributes: valueIds
          .map((id) => valueLabels.get(id))
          .filter((x): x is { attribute: string; value: string } => !!x),
        attributeValueIds: valueIds,
        price: s.price,
        compareAtPrice: s.compareAtPrice,
        salePrice: resolved.salePrice,
        onSale: resolved.onSale,
        discountPct: resolved.discountPct,
        available,
        inStock: available > 0 || s.allowBackorder,
        image,
      });
    }
    return out;
  }

  // ---------- product detail ----------

  async productDetail(idOrSlug: string): Promise<StorefrontProductDetail> {
    const product = await this.products.findOneByIdOrSlug(idOrSlug, true);

    const skus = await this.skuRepo.find({
      where: { productId: product.id, isActive: true },
      order: { createdAt: 'ASC' },
    });

    const comboMap = await this.combosBySku(skus.map((s) => s.id));

    const assigned = await this.productAttributes.getForProduct(product.id);
    const axes = assigned
      .filter((a) => a.isVariation)
      .map((a) => ({
        attributeId: a.attributeId as string,
        name: (a.name as string) ?? '',
        values: ((a.values as AttributeValue[]) ?? []).map((v) => ({
          id: v.id,
          value: v.value,
          meta: v.meta,
        })),
      }));
    const attributes = assigned.map((a) => ({
      attributeId: a.attributeId as string,
      name: (a.name as string) ?? '',
      isVariation: !!a.isVariation,
      values: ((a.values as AttributeValue[]) ?? []).map((v) => ({ id: v.id, value: v.value })),
    }));

    const galleryRows = await this.productMediaRepo.find({
      where: { productId: product.id },
      order: { sortOrder: 'ASC' },
    });
    const primaryMediaId =
      galleryRows.find((r) => r.isPrimary)?.mediaId ?? galleryRows[0]?.mediaId ?? null;

    // One batch each for sale prices and images, then assemble synchronously.
    const pricer = await this.sales.buildPricer([
      { id: product.id, categoryId: product.categoryId },
    ]);
    const imageCache = await this.loadImages([
      ...galleryRows.map((r) => r.mediaId),
      ...skus.map((s) => s.imageMediaId ?? primaryMediaId),
    ]);

    const gallery = galleryRows.map((row) => {
      const img = imageCache.get(row.mediaId) ?? null;
      return {
        mediaId: row.mediaId,
        url: img?.url ?? null,
        isPrimary: row.isPrimary,
        alt: img?.alt ?? null,
      };
    });

    const variants: StorefrontVariantDetail[] = [];
    for (const s of skus) {
      const resolved = pricer.price(product.id, s.price);
      const mediaId = s.imageMediaId ?? primaryMediaId;
      const image = mediaId ? (imageCache.get(mediaId) ?? null) : null;
      const available = s.stock - s.reserved;
      variants.push({
        skuId: s.id,
        sku: s.sku,
        name: s.name,
        attributeValueIds: comboMap.get(s.id) ?? [],
        price: s.price,
        compareAtPrice: s.compareAtPrice,
        salePrice: resolved.salePrice,
        onSale: resolved.onSale,
        discountPct: resolved.discountPct,
        available,
        inStock: available > 0 || s.allowBackorder,
        imageMediaId: s.imageMediaId,
        image,
      });
    }

    return {
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        type: product.type,
        description: product.description,
        shortDescription: product.shortDescription,
        metaTitle: product.metaTitle,
        metaDescription: product.metaDescription,
        brand: product.brand ? { id: product.brand.id, name: product.brand.name } : null,
        category: {
          id: product.category.id,
          name: product.category.name,
          slug: product.category.slug,
        },
        tags: (product.tags ?? []).map((t) => ({ id: t.id, name: t.name })),
      },
      gallery,
      axes,
      attributes,
      variants,
      defaultSkuId: product.defaultSkuId,
    };
  }

  // ---------- helpers ----------

  /** Group SKU → its attribute-value combo ids (one query for all skus). */
  private async combosBySku(skuIds: string[]): Promise<Map<string, string[]>> {
    const map = new Map<string, string[]>();
    if (!skuIds.length) return map;
    const combos = await this.savRepo.find({ where: { skuId: In(skuIds) } });
    for (const c of combos) {
      const arr = map.get(c.skuId) ?? [];
      arr.push(c.attributeValueId);
      map.set(c.skuId, arr);
    }
    return map;
  }

  /**
   * Resolve a set of media ids to `StoreImage`s in a single query, returned as
   * a cache keyed by media id. Null/duplicate ids are ignored; a missing media
   * maps to null — matching the previous per-id `findOne(...).catch(() => null)`.
   */
  private async loadImages(mediaIds: (string | null)[]): Promise<Map<string, StoreImage | null>> {
    const cache = new Map<string, StoreImage | null>();
    const ids = [...new Set(mediaIds.filter((id): id is string => !!id))];
    if (!ids.length) return cache;
    const rows = await this.media.findManyByIds(ids);
    const byId = new Map(rows.map((m) => [m.id, m]));
    for (const id of ids) {
      const m = byId.get(id);
      cache.set(id, m ? this.toStoreImage(m) : null);
    }
    return cache;
  }

  private toStoreImage(m: {
    url: string;
    altText: string | null;
    variants?: { variant: string; url: string; width: number; height: number }[];
  }): StoreImage {
    return {
      url: m.url,
      alt: m.altText,
      variants: (m.variants ?? []).map((v) => ({
        variant: v.variant,
        url: v.url,
        width: v.width,
        height: v.height,
      })),
    };
  }

  private async valueLabels(
    valueIds: string[],
  ): Promise<Map<string, { attribute: string; value: string }>> {
    const map = new Map<string, { attribute: string; value: string }>();
    if (!valueIds.length) return map;
    const values = await this.valueRepo.find({ where: { id: In(valueIds) } });
    const attrIds = [...new Set(values.map((v) => v.attributeId))];
    const attrs = await this.attrRepo.find({ where: { id: In(attrIds) } });
    const attrName = new Map(attrs.map((a) => [a.id, a.name]));
    for (const v of values) {
      map.set(v.id, { attribute: attrName.get(v.attributeId) ?? '', value: v.value });
    }
    return map;
  }

  private async primaryMediaByProduct(productIds: string[]): Promise<Map<string, string>> {
    const rows = await this.productMediaRepo.find({
      where: { productId: In(productIds) },
      order: { sortOrder: 'ASC' },
    });
    const map = new Map<string, string>();
    for (const r of rows) {
      const existing = map.get(r.productId);
      if (!existing || r.isPrimary) map.set(r.productId, r.mediaId);
    }
    return map;
  }
}
