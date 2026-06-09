import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { VerificationTokenType } from '../enums/verification-token-type.enum';

@Entity('verification_tokens')
export class VerificationToken extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @Index()
  @Column({ type: 'varchar', length: 255 })
  tokenHash: string;

  @Column({ type: 'enum', enum: VerificationTokenType })
  type: VerificationTokenType;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  usedAt: Date | null;
}
