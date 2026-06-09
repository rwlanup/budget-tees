import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { UserEmail } from '../entities/user-email.entity';
import { CreateEmailDto, UpdateEmailDto } from '../dto/contact.dto';

@Injectable()
export class UserEmailsService {
  constructor(
    @InjectRepository(UserEmail) private readonly repo: Repository<UserEmail>,
  ) {}

  list(userId: string): Promise<UserEmail[]> {
    return this.repo.find({ where: { userId }, order: { isPrimary: 'DESC', createdAt: 'ASC' } });
  }

  async create(userId: string, dto: CreateEmailDto): Promise<UserEmail> {
    const email = dto.email.trim().toLowerCase();
    if (await this.repo.findOne({ where: { userId, email } })) {
      throw new ConflictException('Email already added');
    }
    const count = await this.repo.count({ where: { userId } });
    const makePrimary = dto.isPrimary || count === 0;
    if (makePrimary) await this.clearPrimary(userId);
    return this.repo.save(
      this.repo.create({ userId, email, label: dto.label ?? null, isPrimary: makePrimary }),
    );
  }

  async update(userId: string, id: string, dto: UpdateEmailDto): Promise<UserEmail> {
    const row = await this.findOwned(userId, id);
    if (dto.isPrimary === true) {
      await this.clearPrimary(userId);
      row.isPrimary = true;
    } else if (dto.isPrimary === false) {
      row.isPrimary = false;
    }
    if (dto.label !== undefined) row.label = dto.label;
    return this.repo.save(row);
  }

  async remove(userId: string, id: string): Promise<void> {
    const row = await this.findOwned(userId, id);
    await this.repo.remove(row);
    if (row.isPrimary) {
      const next = await this.repo.findOne({ where: { userId }, order: { createdAt: 'ASC' } });
      if (next) {
        next.isPrimary = true;
        await this.repo.save(next);
      }
    }
  }

  private async findOwned(userId: string, id: string): Promise<UserEmail> {
    const row = await this.repo.findOne({ where: { id, userId } });
    if (!row) throw new NotFoundException('Email not found');
    return row;
  }

  private async clearPrimary(userId: string): Promise<void> {
    await this.repo.update({ userId, isPrimary: true }, { isPrimary: false });
  }
}
