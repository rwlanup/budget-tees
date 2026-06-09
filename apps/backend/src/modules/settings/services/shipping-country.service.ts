import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShippingCountry } from '../entities/shipping-country.entity';
import { CreateShippingCountryDto } from '../dto/create-shipping-country.dto';
import { UpdateShippingCountryDto } from '../dto/update-shipping-country.dto';

@Injectable()
export class ShippingCountryService {
  constructor(
    @InjectRepository(ShippingCountry)
    private readonly repo: Repository<ShippingCountry>,
  ) {}

  list(activeOnly = false): Promise<ShippingCountry[]> {
    return this.repo.find({
      where: activeOnly ? { isActive: true } : {},
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
  }

  async isAllowed(code: string): Promise<boolean> {
    const c = await this.repo.findOne({ where: { code: code.toUpperCase(), isActive: true } });
    return !!c;
  }

  async create(dto: CreateShippingCountryDto): Promise<ShippingCountry> {
    const code = dto.code.toUpperCase();
    if (await this.repo.findOne({ where: { code } })) {
      throw new ConflictException(`Country ${code} already exists`);
    }
    return this.repo.save(
      this.repo.create({
        code,
        name: dto.name,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
      }),
    );
  }

  async update(code: string, dto: UpdateShippingCountryDto): Promise<ShippingCountry> {
    const country = await this.repo.findOne({ where: { code: code.toUpperCase() } });
    if (!country) throw new NotFoundException(`Country ${code} not found`);
    Object.assign(country, dto);
    return this.repo.save(country);
  }

  async remove(code: string): Promise<void> {
    const res = await this.repo.delete({ code: code.toUpperCase() });
    if (!res.affected) throw new NotFoundException(`Country ${code} not found`);
  }
}
