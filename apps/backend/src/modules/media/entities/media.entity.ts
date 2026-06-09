import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { MediaStatus, MediaType } from '../enums/media.enums';
import { MediaVariant } from './media-variant.entity';

@Entity('media')
export class Media extends BaseEntity {
  @Column({ type: 'enum', enum: MediaType, default: MediaType.IMAGE })
  type: MediaType;

  @Column({ type: 'varchar', length: 255 })
  originalName: string;

  @Column({ type: 'varchar', length: 100 })
  mimeType: string;

  @Column({ type: 'bigint' })
  sizeBytes: string;

  @Column({ type: 'varchar', length: 512 })
  storageKey: string;

  @Column({ type: 'varchar', length: 1024 })
  url: string;

  @Column({ type: 'int', nullable: true })
  width: number | null;

  @Column({ type: 'int', nullable: true })
  height: number | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  altText: string | null;

  @Column({ type: 'varchar', length: 20 })
  driver: string;

  @Column({ type: 'enum', enum: MediaStatus, default: MediaStatus.PROCESSING })
  status: MediaStatus;

  @Column({ type: 'uuid', nullable: true })
  uploadedBy: string | null;

  @OneToMany(() => MediaVariant, (v) => v.media, { eager: true, cascade: true })
  variants: MediaVariant[];
}
