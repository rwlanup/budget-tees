import { DataSource } from 'typeorm';
import * as argon2 from 'argon2';
import { Seeder } from '../../../database/seeds/types';
import { User } from '../entities/user.entity';
import { Role } from '../../role/entities/role.entity';
import { UserStatus } from '../enums/user-status.enum';
import { SYSTEM_ROLES } from '../../../common/constants/permissions';

/**
 * Seeds the initial admin user. Idempotent.
 * Credentials from env (ADMIN_EMAIL / ADMIN_PASSWORD) with safe dev defaults.
 */
export const adminUserSeeder: Seeder = {
  name: 'admin-user',
  async run(dataSource: DataSource): Promise<void> {
    const userRepo = dataSource.getRepository(User);
    const roleRepo = dataSource.getRepository(Role);

    const email = (process.env.ADMIN_EMAIL ?? 'admin@budgettees.local').toLowerCase();
    const password = process.env.ADMIN_PASSWORD ?? 'Admin@12345';

    const existing = await userRepo.findOne({ where: { email } });
    if (existing) return;

    const adminRole = await roleRepo.findOne({ where: { name: SYSTEM_ROLES.ADMIN } });
    if (!adminRole) throw new Error('Admin role not seeded — run role seeder first');

    await userRepo.save(
      userRepo.create({
        email,
        passwordHash: await argon2.hash(password, { type: argon2.argon2id }),
        firstName: 'Store',
        lastName: 'Admin',
        roleId: adminRole.id,
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
      }),
    );
    console.log(`\n    seeded admin: ${email} (change the password!)`);
  },
};
