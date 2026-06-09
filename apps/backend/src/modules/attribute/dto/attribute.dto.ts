import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  ValidateNested,
} from 'class-validator';
import { AttributeType } from '../enums/attribute-type.enum';

export class CreateAttributeDto {
  @IsString() @Length(1, 80) name: string;
  @IsOptional() @Matches(/^[a-z0-9-]+$/) @Length(1, 100) slug?: string;
  @IsEnum(AttributeType) type: AttributeType;
  @IsOptional() @IsBoolean() isVariation?: boolean;
  @IsOptional() @IsBoolean() isFilterable?: boolean;
  @IsOptional() @IsInt() sortOrder?: number;
}

export class UpdateAttributeDto {
  @IsOptional() @IsString() @Length(1, 80) name?: string;
  @IsOptional() @Matches(/^[a-z0-9-]+$/) @Length(1, 100) slug?: string;
  @IsOptional() @IsBoolean() isVariation?: boolean;
  @IsOptional() @IsBoolean() isFilterable?: boolean;
  @IsOptional() @IsInt() sortOrder?: number;
}

export class CreateAttributeValueDto {
  @IsString() @Length(1, 120) value: string;
  @IsOptional() @Matches(/^[a-z0-9-]+$/) @Length(1, 140) slug?: string;
  @IsOptional() @IsObject() meta?: Record<string, unknown>;
  @IsOptional() @IsInt() sortOrder?: number;
}

export class UpdateAttributeValueDto {
  @IsOptional() @IsString() @Length(1, 120) value?: string;
  @IsOptional() @Matches(/^[a-z0-9-]+$/) @Length(1, 140) slug?: string;
  @IsOptional() @IsObject() meta?: Record<string, unknown>;
  @IsOptional() @IsInt() sortOrder?: number;
}

export class ProductAttributeItemDto {
  @IsUUID() attributeId: string;
  @IsOptional() @IsBoolean() isVariation?: boolean;

  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  valueIds: string[];
}

export class SetProductAttributesDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ProductAttributeItemDto)
  attributes: ProductAttributeItemDto[];
}
