import { IsBoolean, IsISO31661Alpha2, IsInt, IsOptional, IsString, Length } from 'class-validator';

export class CreateShippingCountryDto {
  @IsISO31661Alpha2()
  code: string;

  @IsString()
  @Length(2, 100)
  name: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  sortOrder?: number;
}
