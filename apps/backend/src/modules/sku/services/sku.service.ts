import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { Sku } from '../entities/sku.entity';
import { SkuAttributeValue } from '../entities/sku-attribute-value.entity';
import { StockMovement } from '../entities/stock-movement.entity';
import { InventoryService } from './inventory.service';
import { ProductService } from '../../product/product.service';
import { ProductAttributeService } from '../../attribute/services/product-attribute.service';
import { AttributeService } from '../../attribute/services/attribute.service';
import { slugify } from '../../../common/utils/slugify';
import { CreateSkuDto, GenerateSkusDto, UpdateSkuDto, AdjustStockDto } from '../dto/sku.dto';
import { Product } from '../../product/entities/product.entity';

@Injectable()
export class SkuService {
  constructor(
    @InjectRepository(Sku) private readonly repo: Repository<Sku>,
    @InjectRepository(SkuAttributeValue) private readonly savRepo: Repository<SkuAttributeValue>,
    @InjectRepository(StockMovement) private readonly movementRepo: Repository<StockMovement>,
    private readonly inventory: InventoryService,
    private readonly products: ProductService,
    private readonly productAttributes: ProductAttributeService,
    private readonly attributes: AttributeService,
    private readonly dataSource: DataSource,
  ) {}

  listForProduct(productId: string, activeOnly = false): Promise<Sku[]> {
    return this.repo.find({
      where: activeOnly ? { productId, isActive: true } : { productId },
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Sku> {
    const sku = await this.repo.findOne({ where: { id } });
    if (!sku) throw new NotFoundException('SKU not found');
    return sku;
  }

  async comboOf(skuId: string): Promise<string[]> {
    const links = await this.savRepo.find({ where: { skuId } });
    return links.map((l) => l.attributeValueId).sort();
  }

  async create(productId: string, dto: CreateSkuDto): Promise<Sku> {
    const product = await this.products.findOneByIdOrSlug(productId, false);
    await this.assertComboUnique(productId, dto.attributeValueIds);
    const code = dto.sku ?? (await this.generateCode(productId, dto.attributeValueIds));
    const name = dto.name?.trim() || (await this.autoName(product.name, dto.attributeValueIds));
    return this.persistSku(productId, {
      sku: code,
      name,
      barcode: dto.barcode ?? null,
      price: dto.price,
      compareAtPrice: dto.compareAtPrice ?? null,
      costPrice: dto.costPrice ?? null,
      stock: dto.stock ?? 0,
      lowStockThreshold: dto.lowStockThreshold ?? 0,
      allowBackorder: dto.allowBackorder ?? false,
      weightGrams: dto.weightGrams ?? null,
      imageMediaId: dto.imageMediaId ?? null,
      attributeValueIds: dto.attributeValueIds,
    });
  }

  async generate(productId: string, dto: GenerateSkusDto) {
    const product = await this.products.findOneByIdOrSlug(productId, false);
    const axes = await this.productAttributes.getVariationAxes(productId);
    const combos = axes.length ? cartesian(axes.map((a) => a.valueIds)) : [[]];
    const existing = await this.existingCombos(productId);

    const created: Sku[] = [];
    let skipped = 0;
    for (const combo of combos) {
      const key = [...combo].sort().join('|');
      if (existing.has(key)) {
        skipped += 1;
        continue;
      }
      const sku = await this.persistSku(productId, {
        sku: await this.generateCode(productId, combo, dto.skuCodePrefix),
        name: await this.autoName(product.name, combo),
        barcode: null,
        price: dto.defaultPrice ?? 0,
        compareAtPrice: null,
        costPrice: null,
        stock: dto.defaultStock ?? 0,
        lowStockThreshold: 0,
        allowBackorder: false,
        weightGrams: null,
        imageMediaId: null,
        attributeValueIds: combo,
      });
      created.push(sku);
      existing.add(key);
    }
    return { created: created.length, skipped, skus: created };
  }

  async update(id: string, dto: UpdateSkuDto): Promise<Sku> {
    const sku = await this.findOne(id);
    Object.assign(sku, {
      sku: dto.sku ?? sku.sku,
      name: dto.name ?? sku.name,
      barcode: dto.barcode ?? sku.barcode,
      price: dto.price ?? sku.price,
      compareAtPrice: dto.compareAtPrice ?? sku.compareAtPrice,
      costPrice: dto.costPrice ?? sku.costPrice,
      lowStockThreshold: dto.lowStockThreshold ?? sku.lowStockThreshold,
      allowBackorder: dto.allowBackorder ?? sku.allowBackorder,
      weightGrams: dto.weightGrams ?? sku.weightGrams,
      imageMediaId: dto.imageMediaId ?? sku.imageMediaId,
      isActive: dto.isActive ?? sku.isActive,
    });
    if (dto.isDefault === true && !sku.isDefault) {
      await this.repo.update({ productId: sku.productId, isDefault: true }, { isDefault: false });
      sku.isDefault = true;
      await this.products.setDefaultSku(sku.productId, sku.id);
    }
    return this.repo.save(sku);
  }

  async remove(id: string): Promise<void> {
    const sku = await this.findOne(id);
    try {
      await this.repo.remove(sku);
    } catch (err) {
      if (
        err instanceof QueryFailedError &&
        (err as unknown as { code?: string }).code === '23503'
      ) {
        throw new ConflictException('SKU is referenced by orders; deactivate it instead');
      }
      throw err;
    }
    if (sku.isDefault) {
      const next = await this.repo.findOne({
        where: { productId: sku.productId },
        order: { createdAt: 'ASC' },
      });
      await this.products.setDefaultSku(sku.productId, next?.id ?? null);
      if (next) {
        next.isDefault = true;
        await this.repo.save(next);
      }
    }
  }

  adjustStock(id: string, dto: AdjustStockDto, by?: string) {
    return this.inventory.adjust(id, {
      delta: dto.delta,
      setTo: dto.setTo,
      reason: dto.reason,
      by,
    });
  }

  movements(skuId: string): Promise<StockMovement[]> {
    return this.movementRepo.find({ where: { skuId }, order: { createdAt: 'DESC' }, take: 200 });
  }

  lowStock(): Promise<Sku[]> {
    return this.repo
      .createQueryBuilder('s')
      .where('s.isActive = true')
      .andWhere('(s.stock - s.reserved) <= s.lowStockThreshold')
      .orderBy('s.stock', 'ASC')
      .getMany();
  }

  // ---- internals ----

  private async persistSku(
    productId: string,
    data: Omit<Partial<Sku>, 'id'> & { attributeValueIds: string[] },
  ): Promise<Sku> {
    const { attributeValueIds, ...skuData } = data;
    return this.dataSource.transaction(async (mgr) => {
      const count = await mgr.getRepository(Sku).count({ where: { productId } });
      const isFirst = count === 0;
      const sku = await mgr.getRepository(Sku).save({ ...skuData, productId, isDefault: isFirst });
      if (attributeValueIds.length) {
        await mgr
          .getRepository(SkuAttributeValue)
          .save(
            attributeValueIds.map((vid) =>
              mgr.getRepository(SkuAttributeValue).create({ skuId: sku.id, attributeValueId: vid }),
            ),
          );
      }
      if (isFirst)
        await mgr.getRepository(Product).update(productId, {
          defaultSkuId: sku.id,
        });
      return sku;
    });
  }

  /** "<product> <value> <value>" — values in combo order. valuesByIds ignores order, so reorder. */
  private async autoName(productName: string, valueIds: string[]): Promise<string> {
    if (!valueIds.length) return productName;
    const values = await this.attributes.valuesByIds(valueIds);
    const byId = new Map(values.map((v) => [v.id, v.value]));
    const labels = valueIds.map((id) => byId.get(id)).filter((v): v is string => Boolean(v));

    const labelsPart = labels.length ? `(${labels.join(', ')})` : '';

    return [productName, labelsPart].join(' ');
  }

  private async existingCombos(productId: string): Promise<Set<string>> {
    const skus = await this.repo.find({ where: { productId } });
    const set = new Set<string>();
    for (const s of skus) set.add((await this.comboOf(s.id)).join('|'));
    return set;
  }

  private async assertComboUnique(productId: string, valueIds: string[]): Promise<void> {
    const key = [...valueIds].sort().join('|');
    const existing = await this.existingCombos(productId);
    if (existing.has(key))
      throw new ConflictException('A SKU with this variant combination already exists');
  }

  private async generateCode(
    productId: string,
    valueIds: string[],
    prefix?: string,
  ): Promise<string> {
    const product = await this.products.findOneByIdOrSlug(productId, false);
    const values = valueIds.length ? await this.attributes.valuesByIds(valueIds) : [];
    const parts = [prefix ?? product.slug, ...values.map((v) => v.slug)].filter(Boolean);
    const base = slugify(parts.join('-')).toUpperCase().replace(/-/g, '-');
    let candidate = base || `SKU-${Date.now()}`;
    let n = 2;
    while (await this.repo.findOne({ where: { sku: candidate } })) {
      candidate = `${base}-${n}`;
      n += 1;
    }
    return candidate;
  }
}

function cartesian(arrays: string[][]): string[][] {
  return arrays.reduce<string[][]>(
    (acc, curr) => acc.flatMap((a) => curr.map((c) => [...a, c])),
    [[]],
  );
}
