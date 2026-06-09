import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { parsePhoneNumberFromString, CountryCode } from 'libphonenumber-js';
import { UserPhone } from '../entities/user-phone.entity';
import { CreatePhoneDto, UpdatePhoneDto } from '../dto/contact.dto';

@Injectable()
export class UserPhonesService {
  constructor(
    @InjectRepository(UserPhone) private readonly repo: Repository<UserPhone>,
  ) {}

  list(userId: string): Promise<UserPhone[]> {
    return this.repo.find({ where: { userId }, order: { isPrimary: 'DESC', createdAt: 'ASC' } });
  }

  async create(userId: string, dto: CreatePhoneDto): Promise<UserPhone> {
    const e164 = this.normalize(dto.phone, dto.countryCode);
    if (await this.repo.findOne({ where: { userId, e164 } })) {
      throw new ConflictException('Phone already added');
    }
    const count = await this.repo.count({ where: { userId } });
    const makePrimary = dto.isPrimary || count === 0;
    if (makePrimary) await this.clearPrimary(userId);
    return this.repo.save(
      this.repo.create({
        userId,
        e164,
        countryCode: dto.countryCode?.toUpperCase() ?? null,
        label: dto.label ?? null,
        isPrimary: makePrimary,
      }),
    );
  }

  async update(userId: string, id: string, dto: UpdatePhoneDto): Promise<UserPhone> {
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

  private normalize(input: string, country?: string): string {
    const parsed = parsePhoneNumberFromString(input, country?.toUpperCase() as CountryCode);
    if (!parsed || !parsed.isValid()) {
      throw new UnprocessableEntityException('Invalid phone number');
    }
    return parsed.number;
  }

  private async findOwned(userId: string, id: string): Promise<UserPhone> {
    const row = await this.repo.findOne({ where: { id, userId } });
    if (!row) throw new NotFoundException('Phone not found');
    return row;
  }

  private async clearPrimary(userId: string): Promise<void> {
    await this.repo.update({ userId, isPrimary: true }, { isPrimary: false });
  }
}
