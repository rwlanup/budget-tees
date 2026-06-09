import { DataSource } from 'typeorm';
import { Seeder } from '../../../database/seeds/types';
import { PickupLocation } from '../entities/pickup-location.entity';
import { ShippingZone } from '../entities/shipping-zone.entity';

/** Seeds the store pickup location + a country-wide NP shipping zone. Idempotent. */
export const locationSeeder: Seeder = {
  name: 'location',
  async run(dataSource: DataSource): Promise<void> {
    const pickupRepo = dataSource.getRepository(PickupLocation);
    if ((await pickupRepo.count()) === 0) {
      await pickupRepo.save(
        pickupRepo.create({
          name: 'Budget Tees Store',
          phone: '+9779800000000',
          email: 'store@budgettees.local',
          line1: 'Durbar Marg',
          city: 'Kathmandu',
          region: 'Bagmati',
          countryCode: 'NP',
          isActive: true,
        }),
      );
    }

    const zoneRepo = dataSource.getRepository(ShippingZone);
    const npZone = await zoneRepo.findOne({ where: { countryCode: 'NP', isCountryWide: true } });
    if (!npZone) {
      await zoneRepo.save(
        zoneRepo.create({
          name: 'Nepal (nationwide)',
          countryCode: 'NP',
          isCountryWide: true,
          flatRate: 100,
          freeShippingThreshold: 5000,
          isActive: true,
        }),
      );
    }
  },
};
