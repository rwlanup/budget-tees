import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, IsNull, Not, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UserStatus } from './enums/user-status.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { PasswordService } from '../../common/security/password.service';
import { RoleService } from '../role/services/role.service';
import { MediaService } from '../media/services/media.service';
import { SYSTEM_ROLES } from '../../common/constants/permissions';
import { paginate, PaginatedResult } from '../../common/dto/pagination.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
    private readonly passwords: PasswordService,
    private readonly roles: RoleService,
    private readonly media: MediaService,
    private readonly dataSource: DataSource,
  ) {}

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private async resolveRoleId(roleId?: string): Promise<string> {
    if (roleId) {
      await this.roles.findOne(roleId); // throws 404 if missing
      return roleId;
    }
    const customer = await this.roles.findByName(SYSTEM_ROLES.CUSTOMER);
    if (!customer) throw new UnprocessableEntityException('Default customer role not seeded');
    return customer.id;
  }

  async create(dto: CreateUserDto, defaultStatus = UserStatus.ACTIVE): Promise<User> {
    const email = this.normalizeEmail(dto.email);
    if (await this.repo.findOne({ where: { email } })) {
      throw new ConflictException('Email already in use');
    }
    const roleId = await this.resolveRoleId(dto.roleId);
    const user = this.repo.create({
      email,
      passwordHash: await this.passwords.hash(dto.password),
      firstName: dto.firstName,
      lastName: dto.lastName,
      roleId,
      status: dto.status ?? defaultStatus,
    });
    const saved = await this.repo.save(user);
    return this.findById(saved.id);
  }

  async findAll(query: ListUsersQueryDto): Promise<PaginatedResult<User>> {
    const qb = this.repo.createQueryBuilder('u').leftJoinAndSelect('u.role', 'role');
    if (query.status) qb.andWhere('u.status = :status', { status: query.status });
    if (query.roleId) qb.andWhere('u.roleId = :roleId', { roleId: query.roleId });
    if (query.search) {
      qb.andWhere(
        new Brackets((b) =>
          b
            .where('u.email ILIKE :q', { q: `%${query.search}%` })
            .orWhere('u.firstName ILIKE :q', { q: `%${query.search}%` })
            .orWhere('u.lastName ILIKE :q', { q: `%${query.search}%` }),
        ),
      );
    }
    qb.orderBy('u.createdAt', 'DESC').skip(query.skip).take(query.limit);
    const [items, total] = await qb.getManyAndCount();
    return paginate(items, total, query.page, query.limit);
  }

  async findById(id: string): Promise<User> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  /** Includes passwordHash (select:false by default). For Auth login only. */
  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.repo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.role', 'role')
      .addSelect('u.passwordHash')
      .where('u.email = :email', { email: this.normalizeEmail(email) })
      .getOne();
  }

  async updateByAdmin(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    if (dto.roleId && dto.roleId !== user.roleId) {
      await this.roles.findOne(dto.roleId);
      await this.assertNotLastAdminChange(user, dto.roleId);
      user.roleId = dto.roleId;
    }
    if (dto.status && dto.status !== user.status) {
      if (dto.status !== UserStatus.ACTIVE) await this.assertNotLastAdminChange(user, undefined);
      user.status = dto.status;
    }
    if (dto.firstName !== undefined) user.firstName = dto.firstName;
    if (dto.lastName !== undefined) user.lastName = dto.lastName;
    await this.repo.save(user);
    return this.findById(id);
  }

  async assignRole(id: string, roleId: string): Promise<User> {
    return this.updateByAdmin(id, { roleId });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<User> {
    const user = await this.findById(userId);
    if (dto.avatarMediaId) await this.media.assertReady(dto.avatarMediaId);
    if (dto.firstName !== undefined) user.firstName = dto.firstName;
    if (dto.lastName !== undefined) user.lastName = dto.lastName;
    if (dto.avatarMediaId !== undefined) user.avatarMediaId = dto.avatarMediaId;
    await this.repo.save(user);
    return this.findById(userId);
  }

  /** Soft-delete + anonymize PII while preserving order history. */
  async softDeleteAndAnonymize(id: string): Promise<void> {
    const user = await this.findById(id);
    await this.assertNotLastAdminChange(user, undefined);
    await this.dataSource.transaction(async (mgr) => {
      const repo = mgr.getRepository(User);
      user.email = `deleted_${user.id}@anon.local`;
      user.firstName = 'Deleted';
      user.lastName = 'User';
      user.avatarMediaId = null;
      user.passwordHash = await this.passwords.hash(`disabled_${user.id}_${Date.now()}`);
      user.status = UserStatus.DEACTIVATED;
      await repo.save(user);
      await repo.softDelete(user.id);
    });
  }

  async updatePassword(userId: string, plain: string): Promise<void> {
    const hash = await this.passwords.hash(plain);
    await this.repo.update(userId, { passwordHash: hash });
  }

  async setEmailVerified(userId: string): Promise<void> {
    await this.repo.update(userId, { emailVerifiedAt: new Date(), status: UserStatus.ACTIVE });
  }

  async setLastLogin(userId: string): Promise<void> {
    await this.repo.update(userId, { lastLoginAt: new Date() });
  }

  /** Guard: block actions that would remove the last active admin. */
  private async assertNotLastAdminChange(user: User, newRoleId?: string): Promise<void> {
    const adminRole = await this.roles.findByName(SYSTEM_ROLES.ADMIN);
    if (!adminRole || user.roleId !== adminRole.id) return; // not an admin → no constraint
    if (newRoleId && newRoleId === adminRole.id) return; // staying admin
    const activeAdmins = await this.repo.count({
      where: {
        roleId: adminRole.id,
        status: UserStatus.ACTIVE,
        deletedAt: IsNull(),
        id: Not(user.id),
      },
    });
    if (activeAdmins === 0) {
      throw new ConflictException('Cannot remove or disable the last active admin');
    }
  }
}
