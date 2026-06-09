import { IsOptional, IsString, IsUUID, Length } from 'class-validator';

/** Self profile update — whitelisted fields only (no role/status/email). */
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  lastName?: string;

  @IsOptional()
  @IsUUID()
  avatarMediaId?: string;
}
