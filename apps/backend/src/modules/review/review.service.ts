import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ProductReview } from './entities/product-review.entity';
import { ReviewStatus } from './enums/review.enums';
import {
  AdminListReviewQueryDto,
  CreateReviewDto,
  ListReviewQueryDto,
  UpdateReviewDto,
} from './dto/review.dto';
import { OrderItem } from '../order/entities/order-item.entity';
import { OrderStatus } from '../order/enums/order.enums';
import { User } from '../user/entities/user.entity';
import { ProductService } from '../product/product.service';
import { paginate, PaginatedResult } from '../../common/dto/pagination.dto';

/** Order states that prove the customer actually received the product. */
const RECEIVED_STATUSES = [OrderStatus.DELIVERED, OrderStatus.PICKED_UP];

export interface ReviewSummary {
  average: number;
  count: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

export interface PublicReview {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  authorName: string;
  createdAt: Date;
}

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(ProductReview) private readonly repo: Repository<ProductReview>,
    @InjectRepository(OrderItem) private readonly orderItems: Repository<OrderItem>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly products: ProductService,
  ) {}

  /** Most recent received order for this user+product, or null. */
  private async purchaseOrderId(userId: string, productId: string): Promise<string | null> {
    const row = await this.orderItems
      .createQueryBuilder('i')
      .innerJoin('orders', 'o', 'o.id = i."orderId"')
      .where('o."userId" = :userId', { userId })
      .andWhere('i."productId" = :productId', { productId })
      .andWhere('o.status IN (:...statuses)', { statuses: RECEIVED_STATUSES })
      .orderBy('i."createdAt"', 'DESC')
      .select('i."orderId"', 'orderId')
      .limit(1)
      .getRawOne<{ orderId: string }>();
    return row?.orderId ?? null;
  }

  /** Build "First L." display name; falls back to "Customer". */
  private displayName(user?: User | null): string {
    if (!user) return 'Customer';
    const last = user.lastName?.trim();
    const initial = last ? ` ${last[0].toUpperCase()}.` : '';
    return `${user.firstName?.trim() || 'Customer'}${initial}`;
  }

  async summary(productId: string): Promise<ReviewSummary> {
    const rows = await this.repo
      .createQueryBuilder('r')
      .select('r.rating', 'rating')
      .addSelect('COUNT(*)', 'count')
      .where('r."productId" = :productId', { productId })
      .andWhere('r.status = :status', { status: ReviewStatus.PUBLISHED })
      .groupBy('r.rating')
      .getRawMany<{ rating: number; count: string }>();

    const distribution: ReviewSummary['distribution'] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let total = 0;
    let sum = 0;
    for (const row of rows) {
      const rating = Number(row.rating) as 1 | 2 | 3 | 4 | 5;
      const count = Number(row.count);
      distribution[rating] = count;
      total += count;
      sum += rating * count;
    }
    return {
      average: total ? Math.round((sum / total) * 10) / 10 : 0,
      count: total,
      distribution,
    };
  }

  async listPublic(
    productId: string,
    query: ListReviewQueryDto,
  ): Promise<PaginatedResult<PublicReview> & { summary: ReviewSummary }> {
    const [rows, total] = await this.repo.findAndCount({
      where: { productId, status: ReviewStatus.PUBLISHED },
      order: { createdAt: 'DESC' },
      skip: query.skip,
      take: query.limit,
    });

    const userMap = await this.loadUsers(rows.map((r) => r.userId));
    const items: PublicReview[] = rows.map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      body: r.body,
      authorName: this.displayName(userMap.get(r.userId)),
      createdAt: r.createdAt,
    }));

    const summary = await this.summary(productId);
    return { ...paginate(items, total, query.page, query.limit), summary };
  }

  private async loadUsers(ids: string[]): Promise<Map<string, User>> {
    const unique = [...new Set(ids)];
    if (!unique.length) return new Map();
    const users = await this.users.find({ where: { id: In(unique) } });
    return new Map(users.map((u) => [u.id, u]));
  }

  /** Caller's own review + eligibility for the PDP form. */
  async getMine(userId: string, productId: string) {
    const review = await this.repo.findOne({ where: { userId, productId } });
    const hasPurchased = review ? true : (await this.purchaseOrderId(userId, productId)) !== null;
    return {
      review,
      eligibility: {
        hasPurchased,
        alreadyReviewed: !!review,
        canReview: hasPurchased && !review,
      },
    };
  }

  async create(userId: string, dto: CreateReviewDto): Promise<ProductReview> {
    await this.products.findOneByIdOrSlug(dto.productId, true); // must be published
    const existing = await this.repo.findOne({
      where: { userId, productId: dto.productId },
    });
    if (existing) throw new ConflictException('You have already reviewed this product');

    const orderId = await this.purchaseOrderId(userId, dto.productId);
    if (!orderId) {
      throw new ForbiddenException('Only verified buyers can review this product');
    }

    const review = this.repo.create({
      userId,
      productId: dto.productId,
      orderId,
      rating: dto.rating,
      title: dto.title ?? null,
      body: dto.body ?? null,
      status: ReviewStatus.PUBLISHED,
    });
    return this.repo.save(review);
  }

  async update(userId: string, id: string, dto: UpdateReviewDto): Promise<ProductReview> {
    const review = await this.repo.findOne({ where: { id } });
    if (!review || review.userId !== userId) throw new NotFoundException('Review not found');
    if (dto.rating === undefined && dto.title === undefined && dto.body === undefined) {
      throw new BadRequestException('Nothing to update');
    }
    if (dto.rating !== undefined) review.rating = dto.rating;
    if (dto.title !== undefined) review.title = dto.title;
    if (dto.body !== undefined) review.body = dto.body;
    return this.repo.save(review);
  }

  async remove(userId: string, id: string): Promise<{ deleted: true }> {
    const review = await this.repo.findOne({ where: { id } });
    if (!review || review.userId !== userId) throw new NotFoundException('Review not found');
    await this.repo.remove(review);
    return { deleted: true };
  }

  // ----- Admin moderation (REVIEW_MANAGE) -----

  async adminList(query: AdminListReviewQueryDto): Promise<PaginatedResult<ProductReview>> {
    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    if (query.productId) where.productId = query.productId;
    const [items, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: query.skip,
      take: query.limit,
      relations: ['product', 'user'],
      loadEagerRelations: false,
      select: {
        id: true,
        productId: true,
        userId: true,
        rating: true,
        title: true,
        body: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        product: { id: true, name: true, slug: true },
        user: { id: true, firstName: true, lastName: true },
      },
    });
    return paginate(items, total, query.page, query.limit);
  }

  async setStatus(id: string, status: ReviewStatus): Promise<ProductReview> {
    const review = await this.repo.findOne({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');
    review.status = status;
    return this.repo.save(review);
  }

  async adminRemove(id: string): Promise<{ deleted: true }> {
    const review = await this.repo.findOne({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');
    await this.repo.remove(review);
    return { deleted: true };
  }
}
