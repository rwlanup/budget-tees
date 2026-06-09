import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from '../../user/user.service';
import { UserStatus } from '../../user/enums/user-status.enum';
import { PermissionCacheService } from '../services/permission-cache.service';
import { AuthUser } from '../../../common/decorators/current-user.decorator';

interface JwtPayload {
  sub: string;
  roleId: string;
  type: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly users: UserService,
    private readonly permissionCache: PermissionCacheService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.accessSecret')!,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthUser> {
    if (payload.type !== 'access') throw new UnauthorizedException('Invalid token type');
    const user = await this.users.findById(payload.sub).catch(() => null);
    if (!user) throw new UnauthorizedException('User not found');
    if (user.status !== UserStatus.ACTIVE) throw new UnauthorizedException('Account is not active');

    const permissions = await this.permissionCache.getPermissions(user.roleId);
    return {
      id: user.id,
      email: user.email,
      roleId: user.roleId,
      roleName: user.role?.name ?? '',
      permissions,
    };
  }
}
