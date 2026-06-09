import { Seeder } from './types';
import { settingsSeeder } from '../../modules/settings/seeds/settings.seeder';
import { roleSeeder } from '../../modules/role/seeds/role.seeder';
import { adminUserSeeder } from '../../modules/user/seeds/admin-user.seeder';
import { taxSeeder } from '../../modules/tax/seeds/tax.seeder';
import { locationSeeder } from '../../modules/location/seeds/location.seeder';

/**
 * Ordered registry of all seeders required to stand up a fresh store.
 * Entries are appended as each module's seeder is implemented (migration order):
 *   settings -> role -> admin user -> tax -> location.
 */
export const seeders: Seeder[] = [
  settingsSeeder,
  roleSeeder,
  adminUserSeeder,
  taxSeeder,
  locationSeeder,
];
