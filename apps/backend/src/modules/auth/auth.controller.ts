import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Ip,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RefreshDto,
  RegisterDto,
  ResendVerificationDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UserService,
  ) {}

  @Post('register')
  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  login(@Body() dto: LoginDto, @Headers('user-agent') ua: string, @Ip() ip: string) {
    return this.auth.login(dto, { userAgent: ua, ip });
  }

  @Post('refresh')
  @Public()
  refresh(@Body() dto: RefreshDto, @Headers('user-agent') ua: string, @Ip() ip: string) {
    return this.auth.refresh(dto.refreshToken, { userAgent: ua, ip });
  }

  @Post('logout')
  logout(@Body() dto: RefreshDto) {
    return this.auth.logout(dto.refreshToken);
  }

  @Post('logout-all')
  logoutAll(@CurrentUser('id') userId: string) {
    return this.auth.logoutAll(userId);
  }

  @Get('me')
  me(@CurrentUser('id') userId: string) {
    return this.users.findById(userId);
  }

  @Post('verify-email')
  @Public()
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.auth.verifyEmail(dto.token);
  }

  @Post('resend-verification')
  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  resend(@Body() dto: ResendVerificationDto) {
    return this.auth.resendVerification(dto.email);
  }

  @Post('forgot-password')
  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 3 } })
  forgot(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @Public()
  reset(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto);
  }

  @Post('change-password')
  changePassword(@CurrentUser('id') userId: string, @Body() dto: ChangePasswordDto) {
    return this.auth.changePassword(userId, dto);
  }

  @Get('sessions')
  sessions(@CurrentUser('id') userId: string) {
    return this.auth.listSessions(userId);
  }

  @Delete('sessions/:id')
  async revokeSession(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    await this.auth.revokeSession(userId, id);
    return { revoked: true };
  }
}
