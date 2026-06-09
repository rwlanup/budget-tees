import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { SettingType } from '../enums/setting-type.enum';

@Entity('settings')
export class Setting {
  @PrimaryColumn({ type: 'varchar', length: 120 })
  key: string;

  @Column({ type: 'jsonb' })
  value: unknown;

  @Column({ type: 'enum', enum: SettingType })
  type: SettingType;

  @Column({ type: 'varchar', length: 50 })
  group: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string | null;

  @Column({ type: 'boolean', default: false })
  isPublic: boolean;

  @Column({ type: 'uuid', nullable: true })
  updatedBy: string | null;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
