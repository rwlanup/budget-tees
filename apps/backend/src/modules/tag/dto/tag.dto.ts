import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class CreateTagDto {
  @IsString()
  @Length(2, 60)
  name: string;

  @IsOptional()
  @Matches(/^[a-z0-9-]+$/)
  @Length(1, 80)
  slug?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateTagDto {
  @IsOptional()
  @IsString()
  @Length(2, 60)
  name?: string;

  @IsOptional()
  @Matches(/^[a-z0-9-]+$/)
  @Length(1, 80)
  slug?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class MergeTagsDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  sourceIds: string[];

  @IsUUID()
  targetId: string;
}

export class ListTagQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;
}
