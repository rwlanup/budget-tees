import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { FulfillmentMethod, OrderStatus, PaymentMethod, PaymentStatus } from '../enums/order.enums';
import { OrderItem } from './order-item.entity';
import { Payment } from '../../payment/entities/payment.entity';

const numeric = {
  to: (v: number) => v,
  from: (v: string | null) => (v === null ? 0 : parseFloat(v)),
};

export interface AddressSnapshot {
  recipientName: string;
  phone: string;
  email?: string | null;
  line1: string;
  line2?: string | null;
  city: string;
  region?: string | null;
  countryCode: string;
  postalCode?: string | null;
  nearestLandmark?: string | null;
}

@Entity('orders')
export class Order extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 20 })
  orderNumber: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @Index()
  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Index()
  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.UNPAID })
  paymentStatus: PaymentStatus;

  @Column({ type: 'enum', enum: FulfillmentMethod })
  fulfillmentMethod: FulfillmentMethod;

  @Column({ type: 'enum', enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @Column({ type: 'varchar', length: 3, default: 'NPR' })
  currency: string;

  @Column({ type: 'jsonb', nullable: true })
  shippingAddress: AddressSnapshot | null;

  @Column({ type: 'jsonb', nullable: true })
  billingAddress: AddressSnapshot | null;

  @Column({ type: 'uuid', nullable: true })
  pickupLocationId: string | null;

  @Column({ type: 'jsonb', nullable: true })
  pickupLocation: Record<string, unknown> | null;

  @Column({ type: 'varchar', length: 180 })
  contactEmail: string;

  @Column({ type: 'varchar', length: 20 })
  contactPhone: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, transformer: numeric })
  subtotal: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0, transformer: numeric })
  discountTotal: number;

  @Column({ type: 'uuid', nullable: true })
  couponId: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  couponCode: string | null;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0, transformer: numeric })
  shippingCost: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0, transformer: numeric })
  taxTotal: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0, transformer: numeric })
  saleSavings: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, transformer: numeric })
  grandTotal: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  customerNote: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  trackingCarrier: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  trackingNumber: string | null;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 80, nullable: true })
  idempotencyKey: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  placedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  paidAt: Date | null;

  @OneToMany(() => OrderItem, (i) => i.order, { eager: true, cascade: true })
  items: OrderItem[];

  /** Payment attempts/records for this order. Non-eager — loaded explicitly on detail reads. */
  @OneToMany(() => Payment, (p) => p.order)
  payments: Payment[];
}
