import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, In, Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductStatus } from './enums/product.enums';
import { CategoryService } from '../category/category.service';
import { BrandService } from '../brand/brand.service';
import { TagService } from '../tag/tag.service';
import { isUuid } from '../../common/utils/uuid';
import { resolveUniqueSlug } from '../../common/utils/resolve-unique-slug';
import { paginate, PaginatedResult } from '../../common/dto/pagination.dto';
import {
  CreateProductDto,
  ListProductQueryDto,
  SetTagsDto,
  UpdateProductDto,
} from './dto/product.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product) private readonly repo: Repository<Product>,
    private readonly categories: CategoryService,
    private readonly brands: BrandService,
    private readonly tags: TagService,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateProductDto): Promise<Product> {
    const category = await this.categories.findOne(dto.categoryId);
    if (!category.isActive) throw new ConflictException('Category is inactive');
    if (dto.brandId) await this.brands.assertActive(dto.brandId);
    const tags = dto.tagIds ? await this.tags.resolveByIds(dto.tagIds) : [];
    const slug = await this.resolveSlug(dto.slug ?? dto.name);
    const product = this.repo.create({
      name: dto.name,
      slug,
      shortDescription: dto.shortDescription ?? null,
      description: dto.description ?? null,
      categoryId: dto.categoryId,
      brandId: dto.brandId ?? null,
      taxClassId: dto.taxClassId ?? null,
      type: dto.type,
      status: ProductStatus.DRAFT,
      tags,
      metaTitle: dto.metaTitle ?? null,
      metaDescription: dto.metaDescription ?? null,
    });
    return this.repo.save(product);
  }

  async adminList(query: ListProductQueryDto): Promise<PaginatedResult<Product>> {
    return this.runListQuery(query, false);
  }

  async publicList(query: ListProductQueryDto): Promise<PaginatedResult<Product>> {
    return this.runListQuery(query, true);
  }

  private async runListQuery(
    query: ListProductQueryDto,
    publicOnly: boolean,
  ): Promise<PaginatedResult<Product>> {
    const qb = this.repo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.category', 'category')
      .leftJoinAndSelect('p.brand', 'brand')
      .leftJoinAndSelect('p.tags', 'tag');

    if (publicOnly) qb.andWhere('p.status = :pub', { pub: ProductStatus.PUBLISHED });
    else if (query.status) qb.andWhere('p.status = :st', { st: query.status });

    if (query.categoryId) {
      const ids = [query.categoryId, ...(await this.categories.descendantIds(query.categoryId))];
      qb.andWhere('p.categoryId IN (:...cids)', { cids: ids });
    }
    if (query.brandId) qb.andWhere('p.brandId = :bid', { bid: query.brandId });
    if (query.tagIds?.length) {
      qb.andWhere(
        (sub) =>
          'p.id IN ' +
          sub
            .subQuery()
            .select('pt."productId"')
            .from('product_tags', 'pt')
            .where('pt."tagId" IN (:...tids)', { tids: query.tagIds })
            .getQuery(),
      );
    }
    if (query.search) {
      qb.andWhere(
        new Brackets((b) =>
          b
            .where('p.name ILIKE :q', { q: `%${query.search}%` })
            .orWhere('p.shortDescription ILIKE :q', { q: `%${query.search}%` }),
        ),
      );
    }

    switch (query.sort) {
      case 'oldest':
        qb.orderBy('p.createdAt', 'ASC');
        break;
      case 'name':
        qb.orderBy('p.name', 'ASC');
        break;
      default:
        qb.orderBy('p.createdAt', 'DESC');
    }
    qb.skip(query.skip).take(query.limit);
    const [items, total] = await qb.getManyAndCount();
    return paginate(items, total, query.page, query.limit);
  }

  /**
   * Batch sibling of `findOneByIdOrSlug(id, true)`: published, non-soft-deleted
   * products by id (eager relations loaded). Ids that are missing or not
   * published are simply absent from the result — callers skip them, matching
   * the previous per-row `findOneByIdOrSlug(...).catch(() => null)` pattern.
   */
  async findPublishedByIds(ids: string[]): Promise<Product[]> {
    if (!ids.length) return [];
    return this.repo.find({ where: { id: In(ids), status: ProductStatus.PUBLISHED } });
  }

  /**
   * Batch lookup by id, any status, excluding soft-deleted (eager relations
   * loaded) — matches the default scope of `findOneByIdOrSlug(id, false)`.
   * Used where status is decided by the caller (e.g. cart pricing resolves
   * sales regardless of publish state).
   */
  async findByIds(ids: string[]): Promise<Product[]> {
    if (!ids.length) return [];
    return this.repo.find({ where: { id: In(ids) } });
  }

  async findOneByIdOrSlug(idOrSlug: string, publicOnly = true): Promise<Product> {
    const where = isUuid(idOrSlug) ? { id: idOrSlug } : { slug: idOrSlug };
    const product = await this.repo.findOne({ where });
    if (!product) throw new NotFoundException('Product not found');
    if (publicOnly && product.status !== ProductStatus.PUBLISHED) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOneByIdOrSlug(id, false);
    if (dto.categoryId) {
      const cat = await this.categories.findOne(dto.categoryId);
      if (!cat.isActive) throw new ConflictException('Category is inactive');
      product.categoryId = dto.categoryId;
    }
    if (dto.brandId) {
      await this.brands.assertActive(dto.brandId);
      product.brandId = dto.brandId;
    }
    if (dto.slug && dto.slug !== product.slug) product.slug = await this.resolveSlug(dto.slug, id);
    Object.assign(product, {
      name: dto.name ?? product.name,
      shortDescription: dto.shortDescription ?? product.shortDescription,
      description: dto.description ?? product.description,
      taxClassId: dto.taxClassId ?? product.taxClassId,
      type: dto.type ?? product.type,
      metaTitle: dto.metaTitle ?? product.metaTitle,
      metaDescription: dto.metaDescription ?? product.metaDescription,
    });
    return this.repo.save(product);
  }

  async setStatus(id: string, status: ProductStatus): Promise<Product> {
    const product = await this.findOneByIdOrSlug(id, false);
    if (status === ProductStatus.PUBLISHED && !(await this.hasActiveSku(id))) {
      throw new ConflictException({
        code: 'NO_SELLABLE_SKU',
        message: 'Product needs at least one active SKU before publishing',
      });
    }
    product.status = status;
    if (status === ProductStatus.PUBLISHED && !product.publishedAt)
      product.publishedAt = new Date();
    return this.repo.save(product);
  }

  async setTags(id: string, dto: SetTagsDto): Promise<Product> {
    const product = await this.findOneByIdOrSlug(id, false);
    product.tags = await this.tags.resolveByIds(dto.tagIds);
    return this.repo.save(product);
  }

  async softDelete(id: string): Promise<void> {
    const product = await this.findOneByIdOrSlug(id, false);
    await this.repo.softRemove(product);
  }

  /** Used by SKU module to sync defaultSkuId. */
  async setDefaultSku(productId: string, skuId: string | null): Promise<void> {
    await this.repo.update(productId, { defaultSkuId: skuId });
  }

  private async hasActiveSku(productId: string): Promise<boolean> {
    try {
      const rows = await this.dataSource.query(
        `SELECT 1 FROM skus WHERE "productId" = $1 AND "isActive" = true LIMIT 1`,
        [productId],
      );
      return rows.length > 0;
    } catch {
      return false; // skus table not yet present
    }
  }

  private resolveSlug(base: string, excludeId?: string): Promise<string> {
    return resolveUniqueSlug(this.repo, base, { excludeId, withDeleted: true });
  }
}
