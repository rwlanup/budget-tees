import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ContactStatus, ContactTopic } from '../enums/contact.enums';

/** A support message sent from the storefront contact form. `userId` = sender if authenticated. */
@Entity('contact_messages')
export class ContactMessage extends BaseEntity {
  @Index()
  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @Column({ type: 'varchar', length: 100 })
  lastName: string;

  @Column({ type: 'varchar', length: 180 })
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'enum', enum: ContactTopic })
  topic: ContactTopic;

  @Column({ type: 'varchar', length: 4000 })
  message: string;

  @Index()
  @Column({ type: 'enum', enum: ContactStatus, default: ContactStatus.PENDING })
  status: ContactStatus;
}
