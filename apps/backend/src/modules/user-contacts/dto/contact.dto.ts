import { IsBoolean, IsEmail, IsOptional, IsString, Length } from 'class-validator';

export class CreateEmailDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @Length(0, 30)
  label?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class UpdateEmailDto {
  @IsOptional()
  @IsString()
  @Length(0, 30)
  label?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class CreatePhoneDto {
  @IsString()
  @Length(5, 20)
  phone: string;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  countryCode?: string;

  @IsOptional()
  @IsString()
  @Length(0, 30)
  label?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class UpdatePhoneDto {
  @IsOptional()
  @IsString()
  @Length(0, 30)
  label?: string;

  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
