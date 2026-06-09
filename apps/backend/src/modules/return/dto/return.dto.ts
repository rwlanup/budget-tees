import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { ItemCondition, ResolutionType, ReturnReason } from '../enums/return.enums';

export class ReturnItemInputDto {
  @IsUUID() orderItemId: string;
  @IsInt() @Min(1) quantity: number;
  @IsOptional() @IsUUID() exchangeSkuId?: string;
}

export class CreateReturnDto {
  @IsEnum(ResolutionType) resolutionType: ResolutionType;
  @IsEnum(ReturnReason) reason: ReturnReason;
  @IsOptional() @IsString() @Length(0, 500) customerNote?: string;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique((i: ReturnItemInputDto) => i.orderItemId)
  @ValidateNested({ each: true })
  @Type(() => ReturnItemInputDto)
  items: ReturnItemInputDto[];
}

export class ReviewReturnDto {
  @IsEnum({ APPROVE: 'APPROVE', REJECT: 'REJECT' })
  decision: 'APPROVE' | 'REJECT';

  @IsOptional() @IsString() @Length(0, 500) adminNote?: string;
}

export class ReceiveItemDto {
  @IsUUID() returnItemId: string;
  @IsEnum(ItemCondition) conditionOnReceipt: ItemCondition;
  @IsBoolean() restock: boolean;
}

export class ReceiveReturnDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceiveItemDto)
  items: ReceiveItemDto[];
}

export class ResolveReturnDto {
  @IsOptional() @IsNumber() @Min(0) refundAmount?: number;
  @IsOptional() @IsString() @Length(0, 120) externalRef?: string;
}

export class ListReturnsQueryDto extends PaginationQueryDto {
  @IsOptional() @IsString() status?: string;
}
