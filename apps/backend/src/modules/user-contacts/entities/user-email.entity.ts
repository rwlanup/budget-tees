import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('user_emails')
@Index('uq_user_email', ['userId', 'email'], { unique: true })
export class UserEmail extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'citext' })
  email: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  label: string | null;

  @Column({ type: 'boolean', default: false })
  isPrimary: boolean;
}
