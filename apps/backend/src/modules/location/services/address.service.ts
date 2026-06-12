import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UserAddress } from '../entities/user-address.entity';
import { ShippingCountryService } from '../../settings/services/shipping-country.service';
import { CreateAddressDto, UpdateAddressDto } from '../dto/location.dto';

@Injectable()
export class AddressService {
  constructor(
    @InjectRepository(UserAddress) private readonly repo: Repository<UserAddress>,
    private readonly countries: ShippingCountryService,
  ) {}

  list(userId: string): Promise<UserAddress[]> {
    return this.repo.find({ where: { userId }, order: { isDefault: 'DESC', createdAt: 'DESC' } });
  }

  async create(userId: string, dto: CreateAddressDto): Promise<UserAddress> {
    const countryCode = dto.countryCode.toUpperCase();
    if (!(await this.countries.isAllowed(countryCode))) {
      throw new UnprocessableEntityException('Country is not supported');
    }
    const count = await this.repo.count({ where: { userId, type: dto.type } });
    const makeDefault = dto.isDefault || count === 0;
    if (makeDefault) await this.clearDefault(userId, dto.type);
    return this.repo.save(
      this.repo.create({ ...dto, countryCode, userId, isDefault: makeDefault }),
    );
  }

  async update(userId: string, id: string, dto: UpdateAddressDto): Promise<UserAddress> {
    const addr = await this.findOwned(userId, id);
    if (dto.isDefault === true) {
      await this.clearDefault(userId, dto.type ?? addr.type);
      addr.isDefault = true;
    } else if (dto.isDefault === false) {
      addr.isDefault = false;
    }
    Object.assign(addr, {
      type: dto.type ?? addr.type,
      label: dto.label ?? addr.label,
      recipientName: dto.recipientName ?? addr.recipientName,
      phone: dto.phone ?? addr.phone,
      email: dto.email ?? addr.email,
      line1: dto.line1 ?? addr.line1,
      line2: dto.line2 ?? addr.line2,
      city: dto.city ?? addr.city,
      region: dto.region ?? addr.region,
      postalCode: dto.postalCode ?? addr.postalCode,
      nearestLandmark: dto.nearestLandmark ?? addr.nearestLandmark,
    });
    return this.repo.save(addr);
  }

  async remove(userId: string, id: string): Promise<void> {
    const addr = await this.findOwned(userId, id);
    await this.repo.remove(addr);
    if (addr.isDefault) {
      const next = await this.repo.findOne({
        where: { userId, type: addr.type },
        order: { createdAt: 'ASC' },
      });
      if (next) {
        next.isDefault = true;
        await this.repo.save(next);
      }
    }
  }

  /** Used by Order checkout to load a saved address for snapshotting. */
  findOwned(userId: string, id: string): Promise<UserAddress> {
    return this.repo.findOne({ where: { id, userId } }).then((a) => {
      if (!a) throw new NotFoundException('Address not found');
      return a;
    });
  }

  private async clearDefault(userId: string, type: UserAddress['type']): Promise<void> {
    await this.repo.update(
      {
        userId,
        type: type === 'BOTH' ? In(['SHIPPING', 'BILLING']) : In([type, 'BOTH']),
        isDefault: true,
      },
      { isDefault: false },
    );
  }
}
