import { IsEmail, IsString, Length, Matches } from 'class-validator';
import { PASSWORD_REGEX } from '../../user/dto/create-user.dto';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(8, 72)
  @Matches(PASSWORD_REGEX, { message: 'password must include upper, lower, and a digit' })
  password: string;

  @IsString()
  @Length(1, 100)
  firstName: string;

  @IsString()
  @Length(1, 100)
  lastName: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  // Presence only — never leak complexity rules on login.
  @IsString()
  @Length(1, 72)
  password: string;
}

export class RefreshDto {
  @IsString()
  refreshToken: string;
}

export class VerifyEmailDto {
  @IsString()
  token: string;
}

export class ResendVerificationDto {
  @IsEmail()
  email: string;
}

export class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @Length(8, 72)
  @Matches(PASSWORD_REGEX, { message: 'password must include upper, lower, and a digit' })
  password: string;
}

export class ChangePasswordDto {
  @IsString()
  @Length(1, 72)
  currentPassword: string;

  @IsString()
  @Length(8, 72)
  @Matches(PASSWORD_REGEX, { message: 'password must include upper, lower, and a digit' })
  newPassword: string;
}
