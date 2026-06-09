import { DataSource, Repository } from 'typeorm';
import { Seeder } from '../../../database/seeds/types';
import { Permission } from '../entities/permission.entity';
import { Role } from '../entities/role.entity';
import {
  CUSTOMER_PERMISSIONS,
  PERMISSION_CATALOG,
  SYSTEM_ROLES,
} from '../../../common/constants/permissions';

/** Seeds the full permission catalog + admin (all perms) and customer (own-scoped) roles. Idempotent. */
export const roleSeeder: Seeder = {
  name: 'role',
  async run(dataSource: DataSource): Promise<void> {
    const permRepo = dataSource.getRepository(Permission);
    const roleRepo = dataSource.getRepository(Role);

    for (const def of PERMISSION_CATALOG) {
      const existing = await permRepo.findOne({ where: { key: def.key } });
      await permRepo.save({ ...(existing ?? {}), ...def });
    }

    const allPerms = await permRepo.find();
    const customerPerms = allPerms.filter((p) => (CUSTOMER_PERMISSIONS as string[]).includes(p.key));

    await upsertRole(roleRepo, SYSTEM_ROLES.ADMIN, 'Full administrative access', allPerms);
    await upsertRole(roleRepo, SYSTEM_ROLES.CUSTOMER, 'Default customer role', customerPerms);
  },
};

async function upsertRole(
  repo: Repository<Role>,
  name: string,
  description: string,
  permissions: Permission[],
): Promise<void> {
  let role = await repo.findOne({ where: { name } });
  if (!role) role = repo.create({ name });
  role.description = description;
  role.isSystem = true;
  role.permissions = permissions;
  await repo.save(role);
}
