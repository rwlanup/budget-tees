import { DataSource } from 'typeorm';
import { Seeder } from '../../../database/seeds/types';
import { Setting } from '../entities/setting.entity';
import { ShippingCountry } from '../entities/shipping-country.entity';
import { SETTINGS_SCHEMA } from '../constants/settings-schema';

/** Seeds default settings (only missing keys) and a starter shipping country (NP). Idempotent. */
export const settingsSeeder: Seeder = {
  name: 'settings',
  async run(dataSource: DataSource): Promise<void> {
    const settingRepo = dataSource.getRepository(Setting);
    for (const def of Object.values(SETTINGS_SCHEMA)) {
      const existing = await settingRepo.findOne({ where: { key: def.key } });
      if (!existing) {
        await settingRepo.save({
          key: def.key,
          value: def.default,
          type: def.type,
          group: def.group,
          description: def.description,
          isPublic: def.isPublic,
          updatedBy: null,
        });
      }
    }

    const countryRepo = dataSource.getRepository(ShippingCountry);
    const starters = [{ code: 'NP', name: 'Nepal', sortOrder: 0 }];
    for (const c of starters) {
      const existing = await countryRepo.findOne({ where: { code: c.code } });
      if (!existing) {
        await countryRepo.save({ ...c, isActive: true });
      }
    }
  },
};
