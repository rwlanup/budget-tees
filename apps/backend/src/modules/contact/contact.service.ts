import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactMessage } from './entities/contact-message.entity';
import { ContactStatus } from './enums/contact.enums';
import {
  AdminListContactQueryDto,
  CreateContactMessageDto,
} from './dto/contact-message.dto';
import { paginate, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(ContactMessage) private readonly repo: Repository<ContactMessage>,
  ) {}

  async create(userId: string | null, dto: CreateContactMessageDto): Promise<ContactMessage> {
    const message = this.repo.create({
      userId,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      email: dto.email.trim().toLowerCase(),
      phone: dto.phone?.trim() || null,
      topic: dto.topic,
      message: dto.message.trim(),
      status: ContactStatus.PENDING,
    });
    return this.repo.save(message);
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
