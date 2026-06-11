import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, QueryFailedError, Repository } from 'typeorm';
import { Attribute } from '../entities/attribute.entity';
import { AttributeValue } from '../entities/attribute-value.entity';
import { slugify, uniqueSlug } from '../../../common/utils/slugify';
import {
  CreateAttributeDto,
  CreateAttributeValueDto,
  UpdateAttributeDto,
  UpdateAttributeValueDto,
} from '../dto/attribute.dto';

@Injectable()
export class AttributeService {
  constructor(
    @InjectRepository(Attribute) private readonly repo: Repository<Attribute>,
    @InjectRepository(AttributeValue) private readonly valueRepo: Repository<AttributeValue>,
  ) {}

  list(): Promise<Attribute[]> {
    return this.repo.find({ order: { sortOrder: 'ASC', name: 'ASC' } });
  }

  async findOne(idOrSlug: string): Promise<Attribute> {
    const where = isUuid(idOrSlug) ? { id: idOrSlug } : { slug: idOrSlug };
    const attr = await this.repo.findOne({ where });
    if (!attr) throw new NotFoundException('Attribute not found');
    return attr;
  }

  async create(dto: CreateAttributeDto): Promise<Attribute> {
    if (await this.repo.findOne({ where: { name: dto.name } })) {
      throw new ConflictException('Attribute name already exists');
    }
    const slug = await this.slug(dto.slug ?? dto.name);
    return this.repo.save(
      this.repo.create({
        name: dto.name,
        slug,
        type: dto.type,
        isVariation: dto.isVariation ?? false,
        isFilterable: dto.isFilterable ?? true,
        sortOrder: dto.sortOrder ?? 0,
        values: [],
      }),
    );
  }

  async update(id: string, dto: UpdateAttributeDto): Promise<Attribute> {
    const attr = await this.findOne(id);
    if (dto.name && dto.name !== attr.name) {
      const clash = await this.repo.findOne({ where: { name: dto.name } });
      if (clash && clash.id !== id) throw new ConflictException('Attribute name already exists');
      attr.name = dto.name;
    }
    if (dto.slug && dto.slug !== attr.slug) attr.slug = await this.slug(dto.slug, id);
    if (dto.isVariation !== undefined) attr.isVariation = dto.isVariation;
    if (dto.isFilterable !== undefined) attr.isFilterable = dto.isFilterable;
    if (dto.sortOrder !== undefined) attr.sortOrder = dto.sortOrder;
    return this.repo.save(attr);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.guarded(() => this.repo.delete({ id }), 'Attribute is in use');
  }

  async addValue(attributeId: string, dto: CreateAttributeValueDto): Promise<AttributeValue> {
    await this.findOne(attributeId);
    if (await this.valueRepo.findOne({ where: { attributeId, value: dto.value } })) {
      throw new ConflictException('Value already exists for this attribute');
    }
    const slug = await this.valueSlug(attributeId, dto.slug ?? dto.value);
    return this.valueRepo.save(
      this.valueRepo.create({
        attributeId,
        value: dto.value,
        slug,
        meta: dto.meta ?? null,
        sortOrder: dto.sortOrder ?? 0,
      }),
    );
  }

  async updateValue(
    attributeId: string,
    valueId: string,
    dto: UpdateAttributeValueDto,
  ): Promise<AttributeValue> {
    const value = await this.valueRepo.findOne({ where: { id: valueId, attributeId } });
    if (!value) throw new NotFoundException('Attribute value not found');
    if (dto.value) value.value = dto.value;
    if (dto.slug) value.slug = await this.valueSlug(attributeId, dto.slug, valueId);
    if (dto.meta !== undefined) value.meta = dto.meta;
    if (dto.sortOrder !== undefined) value.sortOrder = dto.sortOrder;
    return this.valueRepo.save(value);
  }

  async removeValue(attributeId: string, valueId: string): Promise<void> {
    const value = await this.valueRepo.findOne({ where: { id: valueId, attributeId } });
    if (!value) throw new NotFoundException('Attribute value not found');
    await this.guarded(() => this.valueRepo.delete({ id: valueId }), 'Value is in use');
  }

  async valuesByIds(ids: string[]): Promise<AttributeValue[]> {
    if (!ids.length) return [];
    return this.valueRepo.find({ where: { id: In(ids) } });
  }

  private async guarded(fn: () => Promise<unknown>, msg: string): Promise<void> {
    try {
      await fn();
    } catch (err) {
      if (
        err instanceof QueryFailedError &&
        (err as unknown as { code?: string }).code === '23503'
      ) {
        throw new ConflictException(msg);
      }
      throw err;
    }
  }

  private slug(base: string, excludeId?: string): Promise<string> {
    return uniqueSlug(slugify(base), async (c) => {
      const e = await this.repo.findOne({ where: { slug: c } });
      return !!e && e.id !== excludeId;
    });
  }

  private valueSlug(attributeId: string, base: string, excludeId?: string): Promise<string> {
    return uniqueSlug(slugify(base), async (c) => {
      const e = await this.valueRepo.findOne({ where: { attributeId, slug: c } });
      return !!e && e.id !== excludeId;
    });
  }
}

function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}
