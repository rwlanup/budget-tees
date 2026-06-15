import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { ProductAttribute } from '../entities/product-attribute.entity';
import { ProductAttributeValue } from '../entities/product-attribute-value.entity';
import { AttributeValue } from '../entities/attribute-value.entity';
import { Attribute } from '../entities/attribute.entity';
import { Product } from '../../product/entities/product.entity';
import { ProductType } from '../../product/enums/product.enums';
import { VARIATION_TYPES } from '../enums/attribute-type.enum';
import { SetProductAttributesDto } from '../dto/attribute.dto';

export interface VariationAxis {
  attributeId: string;
  name: string;
  slug: string;
  valueIds: string[];
}

@Injectable()
export class ProductAttributeService {
  constructor(
    @InjectRepository(ProductAttribute) private readonly paRepo: Repository<ProductAttribute>,
    @InjectRepository(ProductAttributeValue)
    private readonly pavRepo: Repository<ProductAttributeValue>,
    @InjectRepository(Attribute) private readonly attrRepo: Repository<Attribute>,
    @InjectRepository(AttributeValue) private readonly valueRepo: Repository<AttributeValue>,
    @InjectRepository(Product) private readonly productRepo: Repository<Product>,
    private readonly dataSource: DataSource,
  ) {}

  async getForProduct(productId: string) {
    const assignments = await this.paRepo.find({
      where: { productId },
      order: { sortOrder: 'ASC' },
    });
    if (!assignments.length) return [];

    // Batch the attribute, link and value lookups (was ~3 queries per assignment).
    const attrMap = await this.attrsByIds(assignments.map((a) => a.attributeId));
    const valueIdsByPa = await this.valueIdsByProductAttribute(assignments.map((a) => a.id));
    const allValueIds = [...new Set([...valueIdsByPa.values()].flat())];
    // Single fetch; filtering it per-assignment preserves the same value order
    // the previous per-assignment `find({ id: In(...) })` produced.
    const allValues = allValueIds.length
      ? await this.valueRepo.find({ where: { id: In(allValueIds) } })
      : [];

    return assignments.map((pa) => {
      const attr = attrMap.get(pa.attributeId);
      const ids = new Set(valueIdsByPa.get(pa.id) ?? []);
      return {
        attributeId: pa.attributeId,
        name: attr?.name,
        type: attr?.type,
        isVariation: pa.isVariation,
        values: allValues.filter((v) => ids.has(v.id)),
      };
    });
  }

  /** Attributes by id, as a lookup map. */
  private async attrsByIds(ids: string[]): Promise<Map<string, Attribute>> {
    const unique = [...new Set(ids)];
    if (!unique.length) return new Map();
    const attrs = await this.attrRepo.find({ where: { id: In(unique) } });
    return new Map(attrs.map((a) => [a.id, a]));
  }

  /** Chosen value ids grouped by productAttribute id (single query, order preserved). */
  private async valueIdsByProductAttribute(paIds: string[]): Promise<Map<string, string[]>> {
    const map = new Map<string, string[]>();
    if (!paIds.length) return map;
    const links = await this.pavRepo.find({ where: { productAttributeId: In(paIds) } });
    for (const l of links) {
      const arr = map.get(l.productAttributeId) ?? [];
      arr.push(l.attributeValueId);
      map.set(l.productAttributeId, arr);
    }
    return map;
  }

  async setForProduct(productId: string, dto: SetProductAttributesDto) {
    // Validate everything before writing.
    const product = await this.productRepo.findOne({ where: { id: productId } });
    if (!product) throw new UnprocessableEntityException('Product not found');
    // SIMPLE products are single-SKU: no variation axes, one value per attribute.
    // (Variation axes + multi-value only make sense for VARIABLE products, where
    // they are the cartesian inputs to SKU generation.)
    const isSimple = product.type === ProductType.SIMPLE;

    const attrIds = dto.attributes.map((a) => a.attributeId);
    const attrs = await this.attrRepo.find({ where: { id: In(attrIds) } });
    const attrMap = new Map(attrs.map((a) => [a.id, a]));

    for (const item of dto.attributes) {
      const attr = attrMap.get(item.attributeId);
      if (!attr) throw new UnprocessableEntityException(`Unknown attribute ${item.attributeId}`);
      if (isSimple && item.isVariation === true) {
        throw new UnprocessableEntityException(
          `Simple products have no variation axes; ${attr.name} cannot be a variation`,
        );
      }
      if (isSimple && item.valueIds.length > 1) {
        throw new UnprocessableEntityException(
          `Simple products allow a single value per attribute; ${attr.name} has multiple`,
        );
      }
      const isVariation = isSimple ? false : (item.isVariation ?? attr.isVariation);
      if (isVariation && !VARIATION_TYPES.includes(attr.type)) {
        throw new UnprocessableEntityException(
          `Attribute ${attr.name} type ${attr.type} cannot be a variation axis`,
        );
      }
      if (isVariation && item.valueIds.length === 0) {
        throw new UnprocessableEntityException(`Variation attribute ${attr.name} needs values`);
      }
      if (item.valueIds.length) {
        const owned = await this.valueRepo.count({
          where: { id: In(item.valueIds), attributeId: item.attributeId },
        });
        if (owned !== item.valueIds.length) {
          throw new UnprocessableEntityException(
            `Some values do not belong to attribute ${attr.name}`,
          );
        }
      }
    }

    await this.dataSource.transaction(async (mgr) => {
      await mgr.getRepository(ProductAttribute).delete({ productId }); // cascades PAV
      for (let i = 0; i < dto.attributes.length; i++) {
        const item = dto.attributes[i];
        const attr = attrMap.get(item.attributeId)!;
        const pa = await mgr.getRepository(ProductAttribute).save(
          mgr.getRepository(ProductAttribute).create({
            productId,
            attributeId: item.attributeId,
            isVariation: isSimple ? false : (item.isVariation ?? attr.isVariation),
            sortOrder: i,
          }),
        );
        if (item.valueIds.length) {
          await mgr.getRepository(ProductAttributeValue).save(
            item.valueIds.map((vid) =>
              mgr.getRepository(ProductAttributeValue).create({
                productAttributeId: pa.id,
                attributeValueId: vid,
              }),
            ),
          );
        }
      }
    });
    return this.getForProduct(productId);
  }

  /** Variation axes for SKU generation: each variation attribute + its chosen value ids. */
  async getVariationAxes(productId: string): Promise<VariationAxis[]> {
    const assignments = await this.paRepo.find({
      where: { productId, isVariation: true },
      order: { sortOrder: 'ASC' },
    });
    if (!assignments.length) return [];

    const attrMap = await this.attrsByIds(assignments.map((a) => a.attributeId));
    const valueIdsByPa = await this.valueIdsByProductAttribute(assignments.map((a) => a.id));

    return assignments.map((pa) => {
      const attr = attrMap.get(pa.attributeId);
      return {
        attributeId: pa.attributeId,
        name: attr?.name ?? '',
        slug: attr?.slug ?? '',
        valueIds: valueIdsByPa.get(pa.id) ?? [],
      };
    });
  }
}
