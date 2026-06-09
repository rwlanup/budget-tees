import {
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { ProductAttribute } from '../entities/product-attribute.entity';
import { ProductAttributeValue } from '../entities/product-attribute-value.entity';
import { AttributeValue } from '../entities/attribute-value.entity';
import { Attribute } from '../entities/attribute.entity';
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
    private readonly dataSource: DataSource,
  ) {}

  async getForProduct(productId: string) {
    const assignments = await this.paRepo.find({
      where: { productId },
      order: { sortOrder: 'ASC' },
    });
    const result: Array<Record<string, unknown>> = [];
    for (const pa of assignments) {
      const attr = await this.attrRepo.findOne({ where: { id: pa.attributeId } });
      const links = await this.pavRepo.find({ where: { productAttributeId: pa.id } });
      const valueIds = links.map((l) => l.attributeValueId);
      const values = valueIds.length
        ? await this.valueRepo.find({ where: { id: In(valueIds) } })
        : [];
      result.push({
        attributeId: pa.attributeId,
        name: attr?.name,
        type: attr?.type,
        isVariation: pa.isVariation,
        values,
      });
    }
    return result;
  }

  async setForProduct(productId: string, dto: SetProductAttributesDto) {
    // Validate everything before writing.
    const attrIds = dto.attributes.map((a) => a.attributeId);
    const attrs = await this.attrRepo.find({ where: { id: In(attrIds) } });
    const attrMap = new Map(attrs.map((a) => [a.id, a]));

    for (const item of dto.attributes) {
      const attr = attrMap.get(item.attributeId);
      if (!attr) throw new UnprocessableEntityException(`Unknown attribute ${item.attributeId}`);
      const isVariation = item.isVariation ?? attr.isVariation;
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
            isVariation: item.isVariation ?? attr.isVariation,
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
    const assignments = await this.paRepo.find({ where: { productId, isVariation: true }, order: { sortOrder: 'ASC' } });
    const axes: VariationAxis[] = [];
    for (const pa of assignments) {
      const attr = await this.attrRepo.findOne({ where: { id: pa.attributeId } });
      const links = await this.pavRepo.find({ where: { productAttributeId: pa.id } });
      axes.push({
        attributeId: pa.attributeId,
        name: attr?.name ?? '',
        slug: attr?.slug ?? '',
        valueIds: links.map((l) => l.attributeValueId),
      });
    }
    return axes;
  }
}
