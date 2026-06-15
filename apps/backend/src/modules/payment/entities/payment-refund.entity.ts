import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Payment } from './payment.entity';
import { numeric } from '../../../common/utils/numeric-transformer';

@Entity('payment_refunds')
export class PaymentRefund {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  paymentId: string;

  @ManyToOne(() => Payment, (p) => p.refunds, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'paymentId' })
  payment: Payment;

  @Column({ type: 'numeric', precision: 12, scale: 2, transformer: numeric })
  amount: number;

  @Column({ type: 'varchar', length: 255 })
  reason: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  externalRef: string | null;

  @Column({ type: 'uuid', nullable: true })
  createdBy: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
