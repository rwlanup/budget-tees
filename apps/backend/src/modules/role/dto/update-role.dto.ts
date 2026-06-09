import { IsOptional, IsString, Length } from 'class-validator';

/** Name is immutable for system roles (guarded in service); not editable here. */
export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  @Length(0, 255)
  description?: string;
}
