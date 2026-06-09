import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShippingZone } from '../entities/shipping-zone.entity';
import { ShippingMethod } from '../enums/location.enums';
import { PickupService } from './pickup.service';
import { ShippingCountryService } from '../../settings/services/shipping-country.service';
import { round2 } from '../../../common/utils/money';

export interface ShippingQuote {
  method: ShippingMethod;
  shippingCost: number;
  freeApplied: boolean;
  zone: string | null;
}

@Injectable()
export class ShippingCalculatorService {
  constructor(
    @InjectRepository(ShippingZone) private readonly zoneRepo: Repository<ShippingZone>,
    private readonly pickups: PickupService,
    private readonly countries: ShippingCountryService,
  ) {}

  async calculate(
    method: ShippingMethod,
    subtotal: number,
    countryCode?: string,
    region?: string,
  ): Promise<ShippingQuote> {
    if (method === ShippingMethod.PICKUP) {
      const store = await this.pickups.getActive();
      if (!store) throw new UnprocessableEntityException('No active pickup location');
      return { method, shippingCost: 0, freeApplied: false, zone: null };
    }

    if (!countryCode) throw new UnprocessableEntityException('Destination country required');
    const country = countryCode.toUpperCase();
    if (!(await this.countries.isAllowed(country))) {
      throw new UnprocessableEntityException({
        code: 'COUNTRY_NOT_SUPPORTED',
        message: 'We do not ship to this country',
      });
    }

    const zones = await this.zoneRepo.find({
      where: { countryCode: country, isActive: true },
      order: { sortOrder: 'ASC' },
    });
    const normalizedRegion = region?.trim().toLowerCase();
    const regionZone = normalizedRegion
      ? zones.find((z) => z.regions?.some((r) => r.region.trim().toLowerCase() === normalizedRegion))
      : undefined;
    const zone = regionZone ?? zones.find((z) => z.isCountryWide);
    if (!zone) {
      throw new UnprocessableEntityException({
        code: 'NO_SHIPPING_ZONE',
        message: 'No shipping zone covers this destination',
      });
    }

    const freeApplied =
      zone.freeShippingThreshold != null && subtotal >= zone.freeShippingThreshold;
    return {
      method,
      shippingCost: freeApplied ? 0 : round2(zone.flatRate),
      freeApplied,
      zone: zone.name,
    };
  }
}
