import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, ILike, In, Repository } from 'typeorm';
import { Tag } from './entities/tag.entity';
import { isUuid } from '../../common/utils/uuid';
import { resolveUniqueSlug } from '../../common/utils/resolve-unique-slug';
import { paginate, PaginatedResult } from '../../common/dto/pagination.dto';
import { CreateTagDto, ListTagQueryDto, MergeTagsDto, UpdateTagDto } from './dto/tag.dto';

@Injectable()
export class TagService {
  constructor(
    @InjectRepository(Tag) private readonly repo: Repository<Tag>,
    private readonly dataSource: DataSource,
  ) {}

  async list(query: ListTagQueryDto): Promise<PaginatedResult<Tag>> {
    const where = {
      ...(query.search ? { name: ILike(`%${query.search}%`) } : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
    };
    const [items, total] = await this.repo.findAndCount({
      where,
      order: { name: 'ASC' },
      skip: query.skip,
      take: query.limit,
    });
    return paginate(items, total, query.page, query.limit);
  }

  async findOne(idOrSlug: string): Promise<Tag> {
    const where = isUuid(idOrSlug) ? { id: idOrSlug } : { slug: idOrSlug };
    const tag = await this.repo.findOne({ where });
    if (!tag) throw new NotFoundException('Tag not found');
    return tag;
  }

  async create(dto: CreateTagDto): Promise<Tag> {
    if (await this.repo.findOne({ where: { name: dto.name } })) {
      throw new ConflictException('Tag name already exists');
    }
    const slug = await this.resolveSlug(dto.slug ?? dto.name);
    return this.repo.save(
      this.repo.create({ name: dto.name, slug, isActive: dto.isActive ?? true }),
    );
  }

  async update(id: string, dto: UpdateTagDto): Promise<Tag> {
    const tag = await this.findOne(id);
    if (dto.name && dto.name !== tag.name) {
      const clash = await this.repo.findOne({ where: { name: dto.name } });
      if (clash && clash.id !== id) throw new ConflictException('Tag name already exists');
      tag.name = dto.name;
    }
    if (dto.slug && dto.slug !== tag.slug) tag.slug = await this.resolveSlug(dto.slug, id);
    if (dto.isActive !== undefined) tag.isActive = dto.isActive;
    return this.repo.save(tag);
  }

  async remove(id: string): Promise<void> {
    const res = await this.repo.delete({ id });
    if (!res.affected) throw new NotFoundException('Tag not found');
  }

  /** Repoint product_tags from sources to target, then delete source tags. */
  async merge(dto: MergeTagsDto): Promise<{ merged: number }> {
    if (dto.sourceIds.includes(dto.targetId)) {
      throw new BadRequestException('Target cannot be among source tags');
    }
    const target = await this.repo.findOne({ where: { id: dto.targetId } });
    if (!target) throw new NotFoundException('Target tag not found');
    const sources = await this.repo.find({ where: { id: In(dto.sourceIds) } });
    if (sources.length !== dto.sourceIds.length) {
      throw new NotFoundException('One or more source tags not found');
    }
    await this.dataSource.transaction(async (mgr) => {
      await mgr.query(
        `INSERT INTO product_tags ("productId","tagId")
         SELECT "productId", $1 FROM product_tags WHERE "tagId" = ANY($2)
         ON CONFLICT DO NOTHING`,
        [dto.targetId, dto.sourceIds],
      );
      await mgr.query(`DELETE FROM product_tags WHERE "tagId" = ANY($1)`, [dto.sourceIds]);
      await mgr.getRepository(Tag).delete({ id: In(dto.sourceIds) });
    });
    return { merged: dto.sourceIds.length };
  }

  /** Find-or-create tags by id; used by Product when attaching. */
  async resolveByIds(ids: string[]): Promise<Tag[]> {
    if (!ids.length) return [];
    const tags = await this.repo.find({ where: { id: In(ids) } });
    if (tags.length !== ids.length) throw new NotFoundException('One or more tags not found');
    return tags;
  }

  private resolveSlug(base: string, excludeId?: string): Promise<string> {
    return resolveUniqueSlug(this.repo, base, { excludeId });
  }
}
