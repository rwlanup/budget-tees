import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { EmailStatus } from '../enums/email.enums';

@Entity('email_logs')
export class EmailLog extends BaseEntity {
  @Index()
  @Column({ type: 'varchar', length: 60 })
  template: string;

  @Column({ type: 'varchar', length: 180 })
  toAddress: string;

  @Column({ type: 'varchar', length: 255 })
  subject: string;

  @Index()
  @Column({ type: 'enum', enum: EmailStatus, default: EmailStatus.QUEUED })
  status: EmailStatus;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  lastError: string | null;

  @Column({ type: 'varchar', length: 180, nullable: true })
  providerMessageId: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  refType: string | null;

  @Column({ type: 'uuid', nullable: true })
  refId: string | null;

  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  /** Render data (kept minimal; no rendered body persisted). */
  @Column({ type: 'jsonb', nullable: true })
  data: Record<string, unknown> | null;

  @Column({ type: 'timestamptz', nullable: true })
  sentAt: Date | null;
}
