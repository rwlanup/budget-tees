import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, QueryFailedError, Repository } from 'typeorm';
import { Brand } from './entities/brand.entity';
import { MediaService } from '../media/services/media.service';
import { isUuid } from '../../common/utils/uuid';
import { resolveUniqueSlug } from '../../common/utils/resolve-unique-slug';
import { paginate, PaginatedResult } from '../../common/dto/pagination.dto';
import { CreateBrandDto, ListBrandQueryDto, UpdateBrandDto } from './dto/brand.dto';

@Injectable()
export class BrandService {
  constructor(
    @InjectRepository(Brand) private readonly repo: Repository<Brand>,
    private readonly media: MediaService,
  ) {}

  async list(query: ListBrandQueryDto, includeInactive = false): Promise<PaginatedResult<Brand>> {
    const where = {
      ...(query.search ? { name: ILike(`%${query.search}%`) } : {}),
      ...(includeInactive
        ? query.isActive !== undefined
          ? { isActive: query.isActive }
          : {}
        : { isActive: true }),
    };
    const [items, total] = await this.repo.findAndCount({
      where,
      order: { name: 'ASC' },
      skip: query.skip,
      take: query.limit,
    });
    return paginate(items, total, query.page, query.limit);
  }

  async findOne(idOrSlug: string): Promise<Brand> {
    const where = isUuid(idOrSlug) ? { id: idOrSlug } : { slug: idOrSlug };
    const brand = await this.repo.findOne({ where });
    if (!brand) throw new NotFoundException('Brand not found');
    return brand;
  }

  /** Validate a brandId is usable for Product assignment (exists + active). */
  async assertActive(id: string): Promise<Brand> {
    const brand = await this.findOne(id);
    if (!brand.isActive) throw new ConflictException('Brand is inactive');
    return brand;
  }

  async create(dto: CreateBrandDto): Promise<Brand> {
    if (await this.repo.findOne({ where: { name: dto.name } })) {
      throw new ConflictException('Brand name already exists');
    }
    if (dto.logoMediaId) await this.media.assertReady(dto.logoMediaId);
    const slug = await this.resolveSlug(dto.slug ?? dto.name);
    return this.repo.save(
      this.repo.create({
        name: dto.name,
        slug,
        description: dto.description ?? null,
        logoMediaId: dto.logoMediaId ?? null,
        websiteUrl: dto.websiteUrl ?? null,
        isActive: dto.isActive ?? true,
        metaTitle: dto.metaTitle ?? null,
        metaDescription: dto.metaDescription ?? null,
      }),
    );
  }

  async update(id: string, dto: UpdateBrandDto): Promise<Brand> {
    const brand = await this.findOne(id);
    if (dto.name && dto.name !== brand.name) {
      const clash = await this.repo.findOne({ where: { name: dto.name } });
      if (clash && clash.id !== id) throw new ConflictException('Brand name already exists');
      brand.name = dto.name;
    }
    if (dto.slug && dto.slug !== brand.slug) brand.slug = await this.resolveSlug(dto.slug, id);
    if (dto.logoMediaId) await this.media.assertReady(dto.logoMediaId);
    Object.assign(brand, {
      description: dto.description ?? brand.description,
      logoMediaId: dto.logoMediaId ?? brand.logoMediaId,
      websiteUrl: dto.websiteUrl ?? brand.websiteUrl,
      isActive: dto.isActive ?? brand.isActive,
      metaTitle: dto.metaTitle ?? brand.metaTitle,
      metaDescription: dto.metaDescription ?? brand.metaDescription,
    });
    return this.repo.save(brand);
  }

  async remove(id: string): Promise<void> {
    const brand = await this.findOne(id);
    try {
      await this.repo.remove(brand);
    } catch (err) {
      if (
        err instanceof QueryFailedError &&
        (err as unknown as { code?: string }).code === '23503'
      ) {
        throw new ConflictException('Brand has products and cannot be deleted');
      }
      throw err;
    }
  }

  private resolveSlug(base: string, excludeId?: string): Promise<string> {
    return resolveUniqueSlug(this.repo, base, { excludeId });
  }
}
