import { IsEnum, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { UserStatus } from '../enums/user-status.enum';

/** Admin update. Password changes go through a separate Auth flow. */
export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  lastName?: string;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @IsOptional()
  @IsUUID()
  roleId?: string;
}
