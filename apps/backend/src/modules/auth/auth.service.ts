import { ForbiddenException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserService } from '../user/user.service';
import { UserStatus } from '../user/enums/user-status.enum';
import { User } from '../user/entities/user.entity';
import { PasswordService } from '../../common/security/password.service';
import { TokenService } from './services/token.service';
import { VerificationTokenType } from './enums/verification-token-type.enum';
import { ChangePasswordDto, LoginDto, RegisterDto, ResetPasswordDto } from './dto/auth.dto';

export interface RequestMeta {
  userAgent?: string;
  ip?: string;
}

const VERIFY_TTL_MS = 24 * 3600_000;
const RESET_TTL_MS = 3600_000;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly users: UserService,
    private readonly tokens: TokenService,
    private readonly passwords: PasswordService,
    private readonly events: EventEmitter2,
    private readonly config: ConfigService,
  ) {}

  private get isProd(): boolean {
    return this.config.get<string>('app.env') === 'production';
  }

  async register(dto: RegisterDto): Promise<{ message: string }> {
    const user = await this.users.create(
      {
        email: dto.email,
        password: dto.password,
        firstName: dto.firstName,
        lastName: dto.lastName,
      },
      UserStatus.PENDING,
    );
    await this.sendVerification(user);
    return { message: 'Registration successful. Please verify your email.' };
  }

  async login(dto: LoginDto, meta: RequestMeta) {
    const user = await this.users.findByEmailWithPassword(dto.email);
    const ok = user && (await this.passwords.verify(user.passwordHash, dto.password));
    if (!user || !ok) throw new UnauthorizedException('Invalid credentials');

    if (user.status === UserStatus.PENDING) {
      throw new ForbiddenException({ code: 'EMAIL_NOT_VERIFIED', message: 'Email not verified' });
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException({ code: 'ACCOUNT_DISABLED', message: 'Account is disabled' });
    }

    await this.users.setLastLogin(user.id);
    return this.issueTokens(user, meta);
  }

  async refresh(rawToken: string, meta: RequestMeta) {
    const { userId, refresh } = await this.tokens.rotateRefreshToken(rawToken, meta);
    const user = await this.users.findById(userId);
    if (user.status !== UserStatus.ACTIVE) throw new UnauthorizedException('Account is not active');
    return {
      accessToken: this.tokens.signAccessToken({ sub: user.id, roleId: user.roleId }),
      expiresIn: this.tokens.accessTtlSeconds(),
      refreshToken: refresh.raw,
    };
  }

  async logout(rawToken: string): Promise<{ success: boolean }> {
    if (rawToken) await this.tokens.revokeRefreshToken(rawToken);
    return { success: true };
  }

  async logoutAll(userId: string): Promise<{ success: boolean }> {
    await this.tokens.revokeAllForUser(userId);
    return { success: true };
  }

  async verifyEmail(token: string): Promise<{ success: boolean }> {
    const userId = await this.tokens.consumeVerificationToken(
      token,
      VerificationTokenType.EMAIL_VERIFY,
    );
    await this.users.setEmailVerified(userId);
    return { success: true };
  }

  async resendVerification(email: string): Promise<{ message: string }> {
    const user = await this.users.findByEmailWithPassword(email);
    if (user && user.status === UserStatus.PENDING) await this.sendVerification(user);
    return { message: 'If the account exists and is unverified, a new email was sent.' };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.users.findByEmailWithPassword(email);
    if (user) {
      const raw = await this.tokens.issueVerificationToken(
        user.id,
        VerificationTokenType.PASSWORD_RESET,
        RESET_TTL_MS,
      );
      this.emitEmail('PASSWORD_RESET', user.email, { token: raw, userId: user.id });
    }
    return { message: 'If the account exists, a reset email was sent.' };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ success: boolean }> {
    const userId = await this.tokens.consumeVerificationToken(
      dto.token,
      VerificationTokenType.PASSWORD_RESET,
    );
    await this.users.updatePassword(userId, dto.password);
    await this.tokens.revokeAllForUser(userId); // force re-login everywhere
    return { success: true };
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<{ success: boolean }> {
    const user = await this.users.findByEmailWithPassword(
      (await this.users.findById(userId)).email,
    );
    if (!user || !(await this.passwords.verify(user.passwordHash, dto.currentPassword))) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    await this.users.updatePassword(userId, dto.newPassword);
    await this.tokens.revokeAllForUser(userId);
    this.emitEmail('PASSWORD_CHANGED', user.email, { userId });
    return { success: true };
  }

  listSessions(userId: string) {
    return this.tokens.listSessions(userId);
  }

  revokeSession(userId: string, id: string) {
    return this.tokens.revokeSession(userId, id);
  }

  private async issueTokens(user: User, meta: RequestMeta) {
    const refresh = await this.tokens.issueRefreshToken(user.id, meta);
    return {
      accessToken: this.tokens.signAccessToken({ sub: user.id, roleId: user.roleId }),
      expiresIn: this.tokens.accessTtlSeconds(),
      refreshToken: refresh.raw,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role?.name,
      },
    };
  }

  private async sendVerification(user: User): Promise<void> {
    const raw = await this.tokens.issueVerificationToken(
      user.id,
      VerificationTokenType.EMAIL_VERIFY,
      VERIFY_TTL_MS,
    );
    this.emitEmail('EMAIL_VERIFICATION', user.email, { token: raw, userId: user.id });
  }

  private emitEmail(template: string, to: string, data: Record<string, unknown>): void {
    this.events.emit('email.send', { template, to, data });
    if (!this.isProd) {
      this.logger.debug(`[email:${template}] to=${to} token=${String(data.token ?? '')}`);
    }
  }
}
