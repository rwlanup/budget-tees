import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, QueryFailedError, Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import { PermissionService } from './permission.service';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { ListRolesQueryDto } from '../dto/list-roles-query.dto';
import { paginate, PaginatedResult } from '../../../common/dto/pagination.dto';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly repo: Repository<Role>,
    private readonly permissions: PermissionService,
  ) {}

  async create(dto: CreateRoleDto): Promise<Role> {
    if (await this.repo.findOne({ where: { name: dto.name } })) {
      throw new ConflictException(`Role "${dto.name}" already exists`);
    }
    const permissions = await this.permissions.findByKeys(dto.permissionKeys ?? []);
    const role = this.repo.create({
      name: dto.name,
      description: dto.description ?? null,
      isSystem: false,
      permissions,
    });
    return this.repo.save(role);
  }

  async findAll(query: ListRolesQueryDto): Promise<PaginatedResult<Role>> {
    const [items, total] = await this.repo.findAndCount({
      where: query.search ? { name: ILike(`%${query.search}%`) } : {},
      order: { name: 'ASC' },
      skip: query.skip,
      take: query.limit,
    });
    return paginate(items, total, query.page, query.limit);
  }

  async findOne(id: string): Promise<Role> {
    const role = await this.repo.findOne({ where: { id } });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  async findByName(name: string): Promise<Role | null> {
    return this.repo.findOne({ where: { name } });
  }

  async update(id: string, dto: UpdateRoleDto): Promise<Role> {
    const role = await this.findOne(id);
    if (dto.description !== undefined) role.description = dto.description;
    return this.repo.save(role);
  }

  async setPermissions(id: string, keys: string[]): Promise<Role> {
    const role = await this.findOne(id);
    role.permissions = await this.permissions.findByKeys(keys);
    return this.repo.save(role);
  }

  async remove(id: string): Promise<void> {
    const role = await this.findOne(id);
    if (role.isSystem) {
      throw new ForbiddenException('System roles cannot be deleted');
    }
    try {
      await this.repo.remove(role);
    } catch (err) {
      // users.roleId is ON DELETE RESTRICT
      if (err instanceof QueryFailedError && (err as unknown as { code?: string }).code === '23503') {
        throw new ConflictException('Role is assigned to users and cannot be deleted');
      }
      throw err;
    }
  }

  /** Effective permission keys for a role — consumed by PermissionsGuard. */
  async getPermissionKeys(roleId: string): Promise<string[]> {
    const role = await this.repo.findOne({ where: { id: roleId } });
    return role ? role.permissions.map((p) => p.key) : [];
  }
}
