import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { PaymentMethod } from '../../order/enums/order.enums';
import { PaymentRecordStatus } from '../enums/payment.enums';
import { Order } from '../../order/entities/order.entity';
import { PaymentRefund } from './payment-refund.entity';

const numeric = {
  to: (v: number) => v,
  from: (v: string | null) => (v === null ? 0 : parseFloat(v)),
};

@Entity('payments')
export class Payment extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  orderId: string;

  @ManyToOne(() => Order, (o) => o.payments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column({ type: 'enum', enum: PaymentMethod })
  method: PaymentMethod;

  @Index()
  @Column({ type: 'enum', enum: PaymentRecordStatus, default: PaymentRecordStatus.INITIATED })
  status: PaymentRecordStatus;

  @Column({ type: 'numeric', precision: 12, scale: 2, transformer: numeric })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'NPR' })
  currency: string;

  @Index()
  @Column({ type: 'varchar', length: 120, nullable: true })
  gatewayRef: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  gatewayTxnId: string | null;

  @Index()
  @Column({ type: 'varchar', length: 80, nullable: true })
  idempotencyKey: string | null;

  @Column({ type: 'jsonb', nullable: true })
  gatewayResponse: Record<string, unknown> | null;

  @Column({ type: 'timestamptz', nullable: true })
  initiatedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  paidAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  failedAt: Date | null;

  @OneToMany(() => PaymentRefund, (r) => r.payment)
  refunds: PaymentRefund[];
}
