import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { CartStatus } from '../enums/cart-status.enum';
import { CartItem } from './cart-item.entity';

@Entity('carts')
export class Cart extends BaseEntity {
  @Index()
  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @Index()
  @Column({ type: 'varchar', length: 64, nullable: true })
  token: string | null;

  @Index()
  @Column({ type: 'enum', enum: CartStatus, default: CartStatus.ACTIVE })
  status: CartStatus;

  @Column({ type: 'varchar', length: 3, default: 'NPR' })
  currency: string;

  @Column({ type: 'timestamptz', nullable: true })
  lastActivityAt: Date | null;

  @OneToMany(() => CartItem, (i) => i.cart, { eager: true, cascade: true })
  items: CartItem[];
}
