import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { ProductStatus, ProductType } from '../enums/product.enums';

export class CreateProductDto {
  @IsString()
  @Length(2, 180)
  name: string;

  @IsOptional()
  @IsString()
  @Length(1, 200)
  slug?: string;

  @IsOptional()
  @IsString()
  @Length(0, 500)
  shortDescription?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUUID()
  categoryId: string;

  @IsOptional()
  @IsUUID()
  brandId?: string;

  @IsOptional()
  @IsUUID()
  taxClassId?: string;

  @IsOptional()
  @IsEnum(ProductType)
  type?: ProductType;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  tagIds?: string[];

  @IsOptional()
  @IsString()
  @Length(0, 255)
  metaTitle?: string;

  @IsOptional()
  @IsString()
  @Length(0, 255)
  metaDescription?: string;
}

export class UpdateProductDto {
  @IsOptional() @IsString() @Length(2, 180) name?: string;
  @IsOptional() @IsString() @Length(1, 200) slug?: string;
  @IsOptional() @IsString() @Length(0, 500) shortDescription?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsUUID() categoryId?: string;
  @IsOptional() @IsUUID() brandId?: string;
  @IsOptional() @IsUUID() taxClassId?: string;
  @IsOptional() @IsEnum(ProductType) type?: ProductType;
  @IsOptional() @IsString() @Length(0, 255) metaTitle?: string;
  @IsOptional() @IsString() @Length(0, 255) metaDescription?: string;
}

export class UpdateStatusDto {
  @IsEnum(ProductStatus)
  status: ProductStatus;
}

export class SetTagsDto {
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  tagIds: string[];
}

export class ListProductQueryDto extends PaginationQueryDto {
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsUUID() categoryId?: string;
  @IsOptional() @IsUUID() brandId?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @Type(() => String)
  tagIds?: string[];

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsIn(['newest', 'oldest', 'name'])
  sort?: 'newest' | 'oldest' | 'name';
}
