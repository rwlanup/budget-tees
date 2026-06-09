import { Injectable } from '@nestjs/common';
import { RoleService } from '../../role/services/role.service';

/** Per-request permission resolution with a short TTL cache (limits DB hits). */
@Injectable()
export class PermissionCacheService {
  private cache = new Map<string, { perms: string[]; expires: number }>();
  private readonly ttlMs = 60_000;

  constructor(private readonly roles: RoleService) {}

  async getPermissions(roleId: string): Promise<string[]> {
    const hit = this.cache.get(roleId);
    if (hit && hit.expires > Date.now()) return hit.perms;
    const perms = await this.roles.getPermissionKeys(roleId);
    this.cache.set(roleId, { perms, expires: Date.now() + this.ttlMs });
    return perms;
  }

  invalidate(roleId?: string): void {
    if (roleId) this.cache.delete(roleId);
    else this.cache.clear();
  }
}
