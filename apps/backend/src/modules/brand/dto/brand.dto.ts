import { Type } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, IsUrl, IsUUID, Length, Matches } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class CreateBrandDto {
  @IsString()
  @Length(2, 120)
  name: string;

  @IsOptional()
  @Matches(/^[a-z0-9-]+$/)
  @Length(1, 140)
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  logoMediaId?: string;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  websiteUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  @Length(0, 255)
  metaTitle?: string;

  @IsOptional()
  @IsString()
  @Length(0, 255)
  metaDescription?: string;
}

export class UpdateBrandDto {
  @IsOptional()
  @IsString()
  @Length(2, 120)
  name?: string;

  @IsOptional()
  @Matches(/^[a-z0-9-]+$/)
  @Length(1, 140)
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  logoMediaId?: string;

  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  websiteUrl?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  @Length(0, 255)
  metaTitle?: string;

  @IsOptional()
  @IsString()
  @Length(0, 255)
  metaDescription?: string;
}

export class ListBrandQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;
}
