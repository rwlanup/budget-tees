import { DataSource } from 'typeorm';
import { Seeder } from '../../../database/seeds/types';
import { TaxClass } from '../entities/tax-class.entity';
import { TaxRate } from '../entities/tax-rate.entity';

/** Seeds a default Standard tax class + 13% VAT for Nepal. Idempotent. */
export const taxSeeder: Seeder = {
  name: 'tax',
  async run(dataSource: DataSource): Promise<void> {
    const classRepo = dataSource.getRepository(TaxClass);
    const rateRepo = dataSource.getRepository(TaxRate);

    let standard = await classRepo.findOne({ where: { slug: 'standard' } });
    if (!standard) {
      standard = await classRepo.save(
        classRepo.create({ name: 'Standard', slug: 'standard', isDefault: true, isActive: true }),
      );
    }

    const existing = await rateRepo.findOne({
      where: { taxClassId: standard.id, countryCode: 'NP' },
    });
    if (!existing) {
      await rateRepo.save(
        rateRepo.create({
          taxClassId: standard.id,
          name: 'VAT',
          countryCode: 'NP',
          rate: 13,
          isActive: true,
        }),
      );
    }
  },
};
