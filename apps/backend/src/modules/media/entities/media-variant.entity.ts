import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { MediaVariantType } from '../enums/media.enums';
import { Media } from './media.entity';

@Entity('media_variants')
export class MediaVariant extends BaseEntity {
  @Column({ type: 'uuid' })
  mediaId: string;

  @ManyToOne(() => Media, (m) => m.variants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'mediaId' })
  media: Media;

  @Column({ type: 'enum', enum: MediaVariantType })
  variant: MediaVariantType;

  @Column({ type: 'varchar', length: 512 })
  storageKey: string;

  @Column({ type: 'varchar', length: 1024 })
  url: string;

  @Column({ type: 'int' })
  width: number;

  @Column({ type: 'int' })
  height: number;

  @Column({ type: 'bigint' })
  sizeBytes: string;
}
