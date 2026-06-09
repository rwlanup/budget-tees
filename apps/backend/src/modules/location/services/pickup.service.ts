import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { PickupLocation } from '../entities/pickup-location.entity';
import { CreatePickupDto, UpdatePickupDto } from '../dto/location.dto';

@Injectable()
export class PickupService {
  constructor(
    @InjectRepository(PickupLocation) private readonly repo: Repository<PickupLocation>,
  ) {}

  list(activeOnly = false): Promise<PickupLocation[]> {
    return this.repo.find({
      where: activeOnly ? { isActive: true } : {},
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  /** The single active store used for pickup. */
  async getActive(): Promise<PickupLocation | null> {
    return this.repo.findOne({ where: { isActive: true }, order: { sortOrder: 'ASC' } });
  }

  async findOne(id: string): Promise<PickupLocation> {
    const p = await this.repo.findOne({ where: { id } });
    if (!p) throw new NotFoundException('Pickup location not found');
    return p;
  }

  async create(dto: CreatePickupDto): Promise<PickupLocation> {
    const pickup = this.repo.create({ ...dto, countryCode: dto.countryCode.toUpperCase() });
    // Keep a single active store: activating a new one deactivates others.
    if (pickup.isActive !== false) {
      await this.repo.update({ isActive: true }, { isActive: false });
      pickup.isActive = true;
    }
    return this.repo.save(pickup);
  }

  async update(id: string, dto: UpdatePickupDto): Promise<PickupLocation> {
    const pickup = await this.findOne(id);
    if (dto.isActive === true) {
      await this.repo.update({ isActive: true, id: Not(id) }, { isActive: false });
    }
    Object.assign(pickup, dto);
    return this.repo.save(pickup);
  }

  async remove(id: string): Promise<void> {
    const res = await this.repo.delete({ id });
    if (!res.affected) throw new NotFoundException('Pickup location not found');
  }
}
