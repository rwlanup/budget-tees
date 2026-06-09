import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, LessThanOrEqual, MoreThan, MoreThanOrEqual, Repository } from 'typeorm';
import { Sale } from '../entities/sale.entity';
import {
  SaleCategory,
  SaleExcludedProduct,
  SaleProduct,
} from '../entities/sale-links.entity';
import { SaleScope, SaleType } from '../enums/sale.enums';
import { CreateSaleDto, ListSaleQueryDto, UpdateSaleDto } from '../dto/sale.dto';
import { paginate, PaginatedResult } from '../../../common/dto/pagination.dto';

@Injectable()
export class SaleService {
  constructor(
    @InjectRepository(Sale) private readonly repo: Repository<Sale>,
    @InjectRepository(SaleProduct) private readonly spRepo: Repository<SaleProduct>,
    @InjectRepository(SaleCategory) private readonly scRepo: Repository<SaleCategory>,
    @InjectRepository(SaleExcludedProduct) private readonly sxRepo: Repository<SaleExcludedProduct>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateSaleDto): Promise<Sale> {
    this.validate(dto.type, dto.value, dto.scope, dto.startsAt, dto.endsAt, dto.productIds, dto.categoryIds);
    return this.dataSource.transaction(async (mgr) => {
      const sale = await mgr.getRepository(Sale).save(
        mgr.getRepository(Sale).create({
          name: dto.name,
          type: dto.type,
          value: dto.value,
          maxDiscountAmount: dto.maxDiscountAmount ?? null,
          scope: dto.scope,
          startsAt: new Date(dto.startsAt),
          endsAt: new Date(dto.endsAt),
          isActive: dto.isActive ?? true,
        }),
      );
      await this.writeLinks(mgr, sale.id, dto.scope, dto.productIds, dto.categoryIds, dto.excludedProductIds);
      return sale;
    });
  }

  async update(id: string, dto: UpdateSaleDto): Promise<Sale> {
    const sale = await this.findOne(id);
    const type = sale.type;
    const value = dto.value ?? sale.value;
    if (type === SaleType.PERCENTAGE && value > 100) {
      throw new BadRequestException('Percentage value cannot exceed 100');
    }
    const startsAt = dto.startsAt ? new Date(dto.startsAt) : sale.startsAt;
    const endsAt = dto.endsAt ? new Date(dto.endsAt) : sale.endsAt;
    if (endsAt <= startsAt) throw new BadRequestException('endsAt must be after startsAt');

    return this.dataSource.transaction(async (mgr) => {
      Object.assign(sale, {
        name: dto.name ?? sale.name,
        value,
        maxDiscountAmount: dto.maxDiscountAmount ?? sale.maxDiscountAmount,
        startsAt,
        endsAt,
        isActive: dto.isActive ?? sale.isActive,
      });
      await mgr.getRepository(Sale).save(sale);
      if (dto.productIds || dto.categoryIds || dto.excludedProductIds) {
        await mgr.getRepository(SaleProduct).delete({ saleId: id });
        await mgr.getRepository(SaleCategory).delete({ saleId: id });
        await mgr.getRepository(SaleExcludedProduct).delete({ saleId: id });
        await this.writeLinks(mgr, id, sale.scope, dto.productIds, dto.categoryIds, dto.excludedProductIds);
      }
      return sale;
    });
  }

  async findOne(id: string): Promise<Sale> {
    const sale = await this.repo.findOne({ where: { id } });
    if (!sale) throw new NotFoundException('Sale not found');
    return sale;
  }

  async list(query: ListSaleQueryDto): Promise<PaginatedResult<Sale>> {
    const now = new Date();
    const where =
      query.status === 'active'
        ? { isActive: true, startsAt: LessThanOrEqual(now), endsAt: MoreThanOrEqual(now) }
        : query.status === 'upcoming'
          ? { startsAt: MoreThan(now) }
          : query.status === 'expired'
            ? { endsAt: LessThanOrEqual(now) }
            : {};
    const [items, total] = await this.repo.findAndCount({
      where,
      order: { startsAt: 'DESC' },
      skip: query.skip,
      take: query.limit,
    });
    return paginate(items, total, query.page, query.limit);
  }

  activeSales(): Promise<Sale[]> {
    const now = new Date();
    return this.repo.find({
      where: { isActive: true, startsAt: LessThanOrEqual(now), endsAt: MoreThanOrEqual(now) },
      order: { startsAt: 'DESC' },
    });
  }

  async remove(id: string): Promise<void> {
    const res = await this.repo.delete({ id }); // links cascade
    if (!res.affected) throw new NotFoundException('Sale not found');
  }

  private validate(
    type: SaleType,
    value: number,
    scope: SaleScope,
    startsAt: string,
    endsAt: string,
    productIds?: string[],
    categoryIds?: string[],
  ): void {
    if (type === SaleType.PERCENTAGE && value > 100) {
      throw new BadRequestException('Percentage value cannot exceed 100');
    }
    if (new Date(endsAt) <= new Date(startsAt)) {
      throw new BadRequestException('endsAt must be after startsAt');
    }
    if (scope === SaleScope.PRODUCTS && !productIds?.length) {
      throw new BadRequestException('PRODUCTS scope requires productIds');
    }
    if (scope === SaleScope.CATEGORIES && !categoryIds?.length) {
      throw new BadRequestException('CATEGORIES scope requires categoryIds');
    }
  }

  private async writeLinks(
    mgr: import('typeorm').EntityManager,
    saleId: string,
    scope: SaleScope,
    productIds?: string[],
    categoryIds?: string[],
    excludedProductIds?: string[],
  ): Promise<void> {
    if (scope === SaleScope.PRODUCTS && productIds?.length) {
      await mgr.getRepository(SaleProduct).save(productIds.map((productId) => ({ saleId, productId })));
    }
    if (scope === SaleScope.CATEGORIES && categoryIds?.length) {
      await mgr.getRepository(SaleCategory).save(categoryIds.map((categoryId) => ({ saleId, categoryId })));
    }
    if (excludedProductIds?.length) {
      await mgr
        .getRepository(SaleExcludedProduct)
        .save(excludedProductIds.map((productId) => ({ saleId, productId })));
    }
  }
}
