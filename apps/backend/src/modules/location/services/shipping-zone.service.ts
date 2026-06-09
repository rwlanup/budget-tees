import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ShippingZone, ShippingZoneRegion } from '../entities/shipping-zone.entity';
import { CreateZoneDto, UpdateZoneDto } from '../dto/location.dto';

@Injectable()
export class ShippingZoneService {
  constructor(
    @InjectRepository(ShippingZone) private readonly repo: Repository<ShippingZone>,
    private readonly dataSource: DataSource,
  ) {}

  list(): Promise<ShippingZone[]> {
    return this.repo.find({ order: { countryCode: 'ASC', sortOrder: 'ASC' } });
  }

  async findOne(id: string): Promise<ShippingZone> {
    const zone = await this.repo.findOne({ where: { id } });
    if (!zone) throw new NotFoundException('Shipping zone not found');
    return zone;
  }

  async create(dto: CreateZoneDto): Promise<ShippingZone> {
    return this.dataSource.transaction(async (mgr) => {
      const zone = await mgr.getRepository(ShippingZone).save(
        mgr.getRepository(ShippingZone).create({
          name: dto.name,
          countryCode: dto.countryCode.toUpperCase(),
          isCountryWide: dto.isCountryWide ?? false,
          flatRate: dto.flatRate,
          freeShippingThreshold: dto.freeShippingThreshold ?? null,
          isActive: dto.isActive ?? true,
          sortOrder: dto.sortOrder ?? 0,
        }),
      );
      if (!zone.isCountryWide && dto.regions?.length) {
        await mgr.getRepository(ShippingZoneRegion).save(
          dto.regions.map((region) => ({ zoneId: zone.id, region })),
        );
      }
      return this.findOne(zone.id);
    });
  }

  async update(id: string, dto: UpdateZoneDto): Promise<ShippingZone> {
    const zone = await this.findOne(id);
    return this.dataSource.transaction(async (mgr) => {
      Object.assign(zone, {
        name: dto.name ?? zone.name,
        isCountryWide: dto.isCountryWide ?? zone.isCountryWide,
        flatRate: dto.flatRate ?? zone.flatRate,
        freeShippingThreshold:
          dto.freeShippingThreshold !== undefined ? dto.freeShippingThreshold : zone.freeShippingThreshold,
        isActive: dto.isActive ?? zone.isActive,
        sortOrder: dto.sortOrder ?? zone.sortOrder,
      });
      await mgr.getRepository(ShippingZone).save(zone);
      if (dto.regions) {
        await mgr.getRepository(ShippingZoneRegion).delete({ zoneId: id });
        if (!zone.isCountryWide && dto.regions.length) {
          await mgr.getRepository(ShippingZoneRegion).save(
            dto.regions.map((region) => ({ zoneId: id, region })),
          );
        }
      }
      return this.findOne(id);
    });
  }

  async remove(id: string): Promise<void> {
    const res = await this.repo.delete({ id }); // regions cascade
    if (!res.affected) throw new NotFoundException('Shipping zone not found');
  }
}
