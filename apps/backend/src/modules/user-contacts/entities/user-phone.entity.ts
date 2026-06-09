import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('user_phones')
@Index('uq_user_phone', ['userId', 'e164'], { unique: true })
export class UserPhone extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  /** Normalized E.164, e.g. +9779812345678. */
  @Column({ type: 'varchar', length: 20 })
  e164: string;

  @Column({ type: 'varchar', length: 2, nullable: true })
  countryCode: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  label: string | null;

  @Column({ type: 'boolean', default: false })
  isPrimary: boolean;
}
