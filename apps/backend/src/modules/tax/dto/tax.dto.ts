import {
  IsBoolean,
  IsISO31661Alpha2,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
} from 'class-validator';

export class CreateTaxClassDto {
  @IsString() @Length(2, 80) name: string;
  @IsOptional() @IsString() @Length(1, 100) slug?: string;
  @IsOptional() @IsBoolean() isDefault?: boolean;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateTaxClassDto {
  @IsOptional() @IsString() @Length(2, 80) name?: string;
  @IsOptional() @IsBoolean() isDefault?: boolean;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class CreateTaxRateDto {
  @IsUUID() taxClassId: string;
  @IsString() @Length(1, 60) name: string;
  @IsISO31661Alpha2() countryCode: string;
  @IsNumber() @Min(0) @Max(100) rate: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class UpdateTaxRateDto {
  @IsOptional() @IsString() @Length(1, 60) name?: string;
  @IsOptional() @IsNumber() @Min(0) @Max(100) rate?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
