import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Permission } from '../entities/permission.entity';

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Permission)
    private readonly repo: Repository<Permission>,
  ) {}

  list(group?: string): Promise<Permission[]> {
    return this.repo.find({
      where: group ? { group } : {},
      order: { group: 'ASC', key: 'ASC' },
    });
  }

  /** Resolve permission keys to entities; throws 422 listing any unknown keys. */
  async findByKeys(keys: string[]): Promise<Permission[]> {
    if (!keys.length) return [];
    const found = await this.repo.find({ where: { key: In(keys) } });
    if (found.length !== keys.length) {
      const foundKeys = new Set(found.map((p) => p.key));
      const missing = keys.filter((k) => !foundKeys.has(k));
      throw new UnprocessableEntityException(`Unknown permission keys: ${missing.join(', ')}`);
    }
    return found;
  }
}
