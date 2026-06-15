import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Category } from './entities/category.entity';
import { Media } from '../media/entities/media.entity';
import { MediaService } from '../media/services/media.service';
import { isUuid } from '../../common/utils/uuid';
import { resolveUniqueSlug } from '../../common/utils/resolve-unique-slug';
import { paginate, PaginatedResult } from '../../common/dto/pagination.dto';
import {
  CreateCategoryDto,
  ListCategoryQueryDto,
  MoveCategoryDto,
  ReorderCategoriesDto,
  UpdateCategoryDto,
} from './dto/category.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category) private readonly repo: Repository<Category>,
    private readonly media: MediaService,
    private readonly dataSource: DataSource,
  ) {}

  async tree(activeOnly = true): Promise<Category[]> {
    const all = await this.repo.find({
      where: activeOnly ? { isActive: true } : {},
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
    // Attach images on the flat list; tree nodes are the same objects (mutated below).
    await this.loadImages(all);
    const byId = new Map<string, Category>();
    all.forEach((c) => byId.set(c.id, Object.assign(c, { children: [] })));
    const roots: Category[] = [];
    for (const node of byId.values()) {
      if (node.parentId && byId.has(node.parentId)) byId.get(node.parentId)!.children.push(node);
      else roots.push(node);
    }
    return roots;
  }

  async list(query: ListCategoryQueryDto): Promise<PaginatedResult<Category>> {
    const qb = this.repo.createQueryBuilder('c');
    if (query.search) qb.andWhere('c.name ILIKE :q', { q: `%${query.search}%` });
    if (query.isActive !== undefined) qb.andWhere('c.isActive = :a', { a: query.isActive });
    if (query.parentId) qb.andWhere('c.parentId = :p', { p: query.parentId });
    qb.orderBy('c.sortOrder', 'ASC').addOrderBy('c.name', 'ASC').skip(query.skip).take(query.limit);
    const [items, total] = await qb.getManyAndCount();
    await this.loadImages(items);
    return paginate(items, total, query.page, query.limit);
  }

  async findOne(idOrSlug: string): Promise<Category> {
    const where = isUuid(idOrSlug) ? { id: idOrSlug } : { slug: idOrSlug };
    const cat = await this.repo.findOne({ where });
    if (!cat) throw new NotFoundException('Category not found');
    await this.loadImages([cat]);
    return cat;
  }

  async ancestors(id: string): Promise<Category[]> {
    const rows = await this.dataSource.query(
      `WITH RECURSIVE anc AS (
         SELECT * FROM categories WHERE id = $1
         UNION ALL
         SELECT c.* FROM categories c JOIN anc ON anc."parentId" = c.id
       ) SELECT * FROM anc WHERE id <> $1`,
      [id],
    );
    const ancestors = (rows as Category[]).reverse(); // root -> parent order
    await this.loadImages(ancestors);
    return ancestors;
  }

  async children(id: string): Promise<Category[]> {
    const kids = await this.repo.find({
      where: { parentId: id },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
    await this.loadImages(kids);
    return kids;
  }

  /** All descendant ids (excluding self) via recursive CTE. */
  async descendantIds(id: string): Promise<string[]> {
    const rows = await this.dataSource.query(
      `WITH RECURSIVE sub AS (
         SELECT id FROM categories WHERE id = $1
         UNION ALL
         SELECT c.id FROM categories c JOIN sub ON c."parentId" = sub.id
       ) SELECT id FROM sub WHERE id <> $1`,
      [id],
    );
    return (rows as { id: string }[]).map((r) => r.id);
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    if (dto.parentId) await this.findOne(dto.parentId);
    if (dto.imageMediaId) await this.media.assertReady(dto.imageMediaId);
    const slug = await this.resolveSlug(dto.slug ?? dto.name);
    const cat = this.repo.create({
      name: dto.name,
      slug,
      description: dto.description ?? null,
      parentId: dto.parentId ?? null,
      imageMediaId: dto.imageMediaId ?? null,
      sortOrder: dto.sortOrder ?? 0,
      isActive: dto.isActive ?? true,
      metaTitle: dto.metaTitle ?? null,
      metaDescription: dto.metaDescription ?? null,
    });
    return this.repo.save(cat);
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const cat = await this.findOne(id);
    if (dto.imageMediaId) await this.media.assertReady(dto.imageMediaId);
    if (dto.slug && dto.slug !== cat.slug) cat.slug = await this.resolveSlug(dto.slug, id);
    Object.assign(cat, {
      name: dto.name ?? cat.name,
      description: dto.description ?? cat.description,
      imageMediaId: dto.imageMediaId ?? cat.imageMediaId,
      sortOrder: dto.sortOrder ?? cat.sortOrder,
      isActive: dto.isActive ?? cat.isActive,
      metaTitle: dto.metaTitle ?? cat.metaTitle,
      metaDescription: dto.metaDescription ?? cat.metaDescription,
    });
    return this.repo.save(cat);
  }

  async move(id: string, dto: MoveCategoryDto): Promise<Category> {
    const cat = await this.findOne(id);
    const newParentId = dto.newParentId ?? null;
    if (newParentId) {
      if (newParentId === id) throw new BadRequestException('Category cannot be its own parent');
      await this.findOne(newParentId);
      const descendants = await this.descendantIds(id);
      if (descendants.includes(newParentId)) {
        throw new BadRequestException('Cannot move a category under its own descendant');
      }
    }
    cat.parentId = newParentId;
    return this.repo.save(cat);
  }

  async reorder(dto: ReorderCategoriesDto): Promise<{ updated: number }> {
    await this.dataSource.transaction(async (mgr) => {
      for (const item of dto.items) {
        await mgr.getRepository(Category).update(item.id, { sortOrder: item.sortOrder });
      }
    });
    return { updated: dto.items.length };
  }

  async remove(id: string, cascade = false): Promise<void> {
    await this.findOne(id);
    const childCount = await this.repo.count({ where: { parentId: id } });
    if (childCount > 0 && !cascade) {
      throw new ConflictException('Category has children; pass cascade=true to delete the subtree');
    }
    if (cascade) {
      const ids = [...(await this.descendantIds(id)), id];
      await this.repo.delete({ id: In(ids) });
    } else {
      await this.repo.delete({ id });
    }
  }

  /**
   * Resolve `imageMediaId` → `image` (transient) for the given categories. Batched
   * + deduped; a missing/not-ready media resolves to `null` rather than throwing.
   */
  private async loadImages(categories: Category[]): Promise<void> {
    const ids = [
      ...new Set(categories.map((c) => c.imageMediaId).filter((id): id is string => !!id)),
    ];
    if (ids.length === 0) {
      for (const c of categories) c.image = null;
      return;
    }
    const resolved = await Promise.all(ids.map((id) => this.media.findOne(id).catch(() => null)));
    const byId = new Map<string, Media>();
    resolved.forEach((m, i) => {
      if (m) byId.set(ids[i], m);
    });
    for (const c of categories)
      c.image = c.imageMediaId ? (byId.get(c.imageMediaId) ?? null) : null;
  }

  private resolveSlug(base: string, excludeId?: string): Promise<string> {
    return resolveUniqueSlug(this.repo, base, { excludeId });
  }
}
