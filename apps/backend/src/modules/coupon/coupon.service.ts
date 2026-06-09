import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, ILike, Repository } from 'typeorm';
import { Coupon } from './entities/coupon.entity';
import { CouponCategory, CouponProduct, CouponRedemption } from './entities/coupon-links.entity';
import { RedemptionStatus } from './enums/coupon.enums';
import { CreateCouponDto, ListCouponQueryDto, UpdateCouponDto } from './dto/coupon.dto';
import { paginate, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class CouponService {
  constructor(
    @InjectRepository(Coupon) private readonly repo: Repository<Coupon>,
    @InjectRepository(CouponProduct) private readonly cpRepo: Repository<CouponProduct>,
    @InjectRepository(CouponCategory) private readonly ccRepo: Repository<CouponCategory>,
    @InjectRepository(CouponRedemption) private readonly redRepo: Repository<CouponRedemption>,
    private readonly dataSource: DataSource,
  ) {}

  async create(dto: CreateCouponDto): Promise<Coupon> {
    if (await this.repo.findOne({ where: { code: dto.code } })) {
      throw new ConflictException('Coupon code already exists');
    }
    return this.dataSource.transaction(async (mgr) => {
      const coupon = await mgr.getRepository(Coupon).save(
        mgr.getRepository(Coupon).create({
          code: dto.code,
          description: dto.description ?? null,
          type: dto.type,
          value: dto.value ?? null,
          maxDiscountAmount: dto.maxDiscountAmount ?? null,
          minOrderAmount: dto.minOrderAmount ?? null,
          appliesTo: dto.appliesTo,
          firstOrderOnly: dto.firstOrderOnly ?? false,
          usageLimit: dto.usageLimit ?? null,
          usageLimitPerUser: dto.usageLimitPerUser ?? 1,
          startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
          endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
          isActive: dto.isActive ?? true,
        }),
      );
      await this.writeLinks(mgr, coupon.id, dto.productIds, dto.categoryIds);
      return coupon;
    });
  }

  async update(id: string, dto: UpdateCouponDto): Promise<Coupon> {
    const coupon = await this.findOne(id);
    return this.dataSource.transaction(async (mgr) => {
      Object.assign(coupon, {
        description: dto.description ?? coupon.description,
        value: dto.value ?? coupon.value,
        maxDiscountAmount: dto.maxDiscountAmount ?? coupon.maxDiscountAmount,
        minOrderAmount: dto.minOrderAmount ?? coupon.minOrderAmount,
        firstOrderOnly: dto.firstOrderOnly ?? coupon.firstOrderOnly,
        usageLimit: dto.usageLimit ?? coupon.usageLimit,
        usageLimitPerUser: dto.usageLimitPerUser ?? coupon.usageLimitPerUser,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : coupon.startsAt,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : coupon.endsAt,
        isActive: dto.isActive ?? coupon.isActive,
      });
      await mgr.getRepository(Coupon).save(coupon);
      if (dto.productIds || dto.categoryIds) {
        await mgr.getRepository(CouponProduct).delete({ couponId: id });
        await mgr.getRepository(CouponCategory).delete({ couponId: id });
        await this.writeLinks(mgr, id, dto.productIds, dto.categoryIds);
      }
      return coupon;
    });
  }

  async findOne(id: string): Promise<Coupon> {
    const coupon = await this.repo.findOne({ where: { id } });
    if (!coupon) throw new NotFoundException('Coupon not found');
    return coupon;
  }

  findByCode(code: string): Promise<Coupon | null> {
    return this.repo.findOne({ where: { code } });
  }

  productIds(couponId: string): Promise<CouponProduct[]> {
    return this.cpRepo.find({ where: { couponId } });
  }

  categoryIds(couponId: string): Promise<CouponCategory[]> {
    return this.ccRepo.find({ where: { couponId } });
  }

  async list(query: ListCouponQueryDto): Promise<PaginatedResult<Coupon>> {
    const where = {
      ...(query.search ? { code: ILike(`%${query.search}%`) } : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
    };
    const [items, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: query.skip,
      take: query.limit,
    });
    return paginate(items, total, query.page, query.limit);
  }

  async remove(id: string): Promise<void> {
    const redemptions = await this.redRepo.count({ where: { couponId: id } });
    if (redemptions > 0) {
      throw new ConflictException('Coupon has redemptions; deactivate it instead');
    }
    await this.repo.delete({ id });
  }

  private async writeLinks(
    mgr: import('typeorm').EntityManager,
    couponId: string,
    productIds?: string[],
    categoryIds?: string[],
  ): Promise<void> {
    if (productIds?.length) {
      await mgr.getRepository(CouponProduct).save(productIds.map((productId) => ({ couponId, productId })));
    }
    if (categoryIds?.length) {
      await mgr.getRepository(CouponCategory).save(categoryIds.map((categoryId) => ({ couponId, categoryId })));
    }
  }
}
