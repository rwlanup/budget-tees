import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { NotificationType } from './enums/notification.enums';
import { NotificationEvent } from './notification-event';
import { planNotifications } from './notification.planner';
import { User } from '../user/entities/user.entity';
import { PERMISSIONS } from '../../common/constants/permissions';
import { paginate, PaginatedResult, PaginationQueryDto } from '../../common/dto/pagination.dto';

/** Which admin permission gates each admin-fanned-out notification type (null = customer-only). */
const ADMIN_PERMISSION: Partial<Record<NotificationType, string>> = {
  [NotificationType.ORDER_PLACED]: PERMISSIONS.ORDER_MANAGE,
  [NotificationType.PAYMENT_STATUS_UPDATED]: PERMISSIONS.PAYMENT_MANAGE,
  [NotificationType.RETURN_CREATED]: PERMISSIONS.RETURN_MANAGE,
  [NotificationType.RETURN_CANCELLED]: PERMISSIONS.RETURN_MANAGE,
  [NotificationType.CONTACT_SUBMITTED]: PERMISSIONS.CONTACT_MANAGE,
  [NotificationType.LOW_STOCK]: PERMISSIONS.SKU_MANAGE,
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification) private readonly repo: Repository<Notification>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  /**
   * Resolve recipients for a business event, suppress self-notifications + duplicates, and
   * persist. Fire-and-forget from the listener — failures are logged, never thrown back into
   * the business transaction.
   */
  async dispatch(event: NotificationEvent): Promise<void> {
    try {
      const permission = ADMIN_PERMISSION[event.type];
      const adminIds = permission ? await this.findActiveAdminIds(permission) : [];
      const planned = planNotifications(event, adminIds);
      if (!planned.length) return;
      // ON CONFLICT DO NOTHING against the (recipientId, deduplicationKey) unique index → dedup.
      await this.repo
        .createQueryBuilder()
        .insert()
        .into(Notification)
        .values(planned)
        .orIgnore()
        .execute();
    } catch (err) {
      this.logger.error(`Failed to dispatch ${event.type} notification`, err as Error);
    }
  }

  /** Active users whose role grants `permissionKey` (admin notification recipients). */
  private async findActiveAdminIds(permissionKey: string): Promise<string[]> {
    const rows = await this.userRepo
      .createQueryBuilder('u')
      .innerJoin('u.role', 'role')
      .innerJoin('role.permissions', 'perm')
      .where('perm.key = :key', { key: permissionKey })
      .andWhere('u.status = :status', { status: 'ACTIVE' })
      .andWhere('u.deletedAt IS NULL')
      .select('u.id', 'id')
      .getRawMany<{ id: string }>();
    return rows.map((r) => r.id);
  }

  // ----- read / mutate (always scoped to the requesting user) -----

  async list(userId: string, query: PaginationQueryDto): Promise<PaginatedResult<Notification>> {
    const [items, total] = await this.repo.findAndCount({
      where: { recipientId: userId },
      order: { createdAt: 'DESC' },
      skip: query.skip,
      take: query.limit,
    });
    return paginate(items, total, query.page, query.limit);
  }

  async unseenCount(userId: string): Promise<{ count: number }> {
    return { count: await this.repo.count({ where: { recipientId: userId, isSeen: false } }) };
  }

  /** Marks one notification seen, scoped to the owner (no-op if it isn't theirs). */
  async markSeen(id: string, userId: string): Promise<{ success: boolean }> {
    await this.repo.update({ id, recipientId: userId }, { isSeen: true });
    return { success: true };
  }

  async markAllSeen(userId: string): Promise<{ success: boolean }> {
    await this.repo.update({ recipientId: userId, isSeen: false }, { isSeen: true });
    return { success: true };
  }
}
