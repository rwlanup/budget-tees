import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Repository } from 'typeorm';
import { ContactMessage } from './entities/contact-message.entity';
import { ContactStatus } from './enums/contact.enums';
import { AdminListContactQueryDto, CreateContactMessageDto } from './dto/contact-message.dto';
import { paginate, PaginatedResult } from '../../common/dto/pagination.dto';
import { emitNotification } from '../notification/notification-event';
import { NotificationActorType, NotificationType } from '../notification/enums/notification.enums';

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(ContactMessage) private readonly repo: Repository<ContactMessage>,
    private readonly events: EventEmitter2,
  ) {}

  async create(userId: string | null, dto: CreateContactMessageDto): Promise<ContactMessage> {
    const message = await this.repo.save(
      this.repo.create({
        userId,
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        email: dto.email.trim().toLowerCase(),
        phone: dto.phone?.trim() || null,
        topic: dto.topic,
        message: dto.message.trim(),
        status: ContactStatus.PENDING,
      }),
    );
    // Notify contact-managing admins (a logged-in admin submitting is not self-notified).
    emitNotification(this.events, {
      type: NotificationType.CONTACT_SUBMITTED,
      actorId: userId,
      actorType: userId ? NotificationActorType.CUSTOMER : NotificationActorType.SYSTEM,
      contact: { id: message.id },
    });
    return message;
  }

  // ----- Admin (CONTACT_MANAGE) -----

  async adminList(query: AdminListContactQueryDto): Promise<PaginatedResult<ContactMessage>> {
    const where: Record<string, unknown> = {};
    if (query.status) where.status = query.status;
    if (query.topic) where.topic = query.topic;
    const [items, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: query.skip,
      take: query.limit,
    });
    return paginate(items, total, query.page, query.limit);
  }

  /** Count of unhandled (PENDING) messages — for the admin sidebar badge. */
  async pendingCount(): Promise<{ count: number }> {
    return { count: await this.repo.count({ where: { status: ContactStatus.PENDING } }) };
  }

  async findOne(id: string): Promise<ContactMessage> {
    const message = await this.repo.findOne({ where: { id } });
    if (!message) throw new NotFoundException('Contact message not found');
    return message;
  }

  async setStatus(id: string, status: ContactStatus): Promise<ContactMessage> {
    const message = await this.findOne(id);
    message.status = status;
    return this.repo.save(message);
  }
}
