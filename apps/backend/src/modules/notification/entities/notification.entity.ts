import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { NotificationActorType, NotificationRecipientType, NotificationType } from '../enums/notification.enums';

/**
 * A per-recipient notification row. Admin notifications fan out to one row per eligible
 * admin user, so `isSeen` and ownership are tracked per user. Stored as varchar enums to
 * keep the type set easy to extend without enum-type migrations.
 */
@Entity('notifications')
// List + unseen-count are always scoped by recipient; ordered newest-first.
@Index('idx_notifications_recipient', ['recipientId', 'createdAt'])
@Index('idx_notifications_recipient_unseen', ['recipientId', 'isSeen'])
export class Notification extends BaseEntity {
  @Column({ type: 'varchar', length: 20 })
  recipientType: NotificationRecipientType;

  @Index()
  @Column({ type: 'uuid' })
  recipientId: string;

  @Column({ type: 'varchar', length: 40 })
  type: NotificationType;

  @Column({ type: 'varchar', length: 160 })
  title: string;

  @Column({ type: 'varchar', length: 400 })
  message: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  relatedEntityType: string | null;

  @Column({ type: 'uuid', nullable: true })
  relatedEntityId: string | null;

  /** Frontend route to open when the notification is clicked. */
  @Column({ type: 'varchar', length: 300 })
  route: string;

  @Column({ type: 'boolean', default: false })
  isSeen: boolean;

  @Column({ type: 'uuid', nullable: true })
  actorId: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  actorType: NotificationActorType | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  /**
   * Idempotency key for one logical business action + recipient. A partial unique index on
   * (recipientId, deduplicationKey) + ON CONFLICT DO NOTHING collapses duplicate events.
   */
  @Column({ type: 'varchar', length: 200, nullable: true })
  deduplicationKey: string | null;
}
