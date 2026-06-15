import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { StockMovementType } from '../enums/stock-movement-type.enum';
import { Sku } from './sku.entity';

@Entity('stock_movements')
export class StockMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid' })
  skuId: string;

  @ManyToOne(() => Sku, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'skuId' })
  sku: Sku;

  @Column({ type: 'enum', enum: StockMovementType })
  type: StockMovementType;

  @Column({ type: 'int' })
  qty: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  reason: string | null;

  @Column({ type: 'varchar', length: 40, nullable: true })
  refType: string | null;

  @Column({ type: 'uuid', nullable: true })
  refId: string | null;

  @Column({ type: 'uuid', nullable: true })
  createdBy: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
