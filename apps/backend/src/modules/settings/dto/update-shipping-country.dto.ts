import { IsBoolean, IsInt, IsOptional, IsString, Length } from 'class-validator';

export class UpdateShippingCountryDto {
  @IsOptional()
  @IsString()
  @Length(2, 100)
  name?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
