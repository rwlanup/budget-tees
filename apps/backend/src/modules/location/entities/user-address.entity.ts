import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../user/entities/user.entity';
import { AddressType } from '../enums/location.enums';

@Entity('user_addresses')
export class UserAddress extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'enum', enum: AddressType, default: AddressType.SHIPPING })
  type: AddressType;

  @Column({ type: 'varchar', length: 40, nullable: true })
  label: string | null;

  @Column({ type: 'varchar', length: 120 })
  recipientName: string;

  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @Column({ type: 'varchar', length: 180, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 180 })
  line1: string;

  @Column({ type: 'varchar', length: 180, nullable: true })
  line2: string | null;

  @Column({ type: 'varchar', length: 100 })
  city: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  region: string | null;

  @Column({ type: 'varchar', length: 2 })
  countryCode: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  postalCode: string | null;

  @Column({ type: 'varchar', length: 180, nullable: true })
  nearestLandmark: string | null;

  @Column({ type: 'boolean', default: false })
  isDefault: boolean;
}
