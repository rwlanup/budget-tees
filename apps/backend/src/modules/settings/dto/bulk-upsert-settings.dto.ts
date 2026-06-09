import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsDefined, IsString, ValidateNested } from 'class-validator';

export class SettingItemDto {
  @IsString()
  key: string;

  @IsDefined()
  value: unknown;
}

export class BulkUpsertSettingsDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => SettingItemDto)
  items: SettingItemDto[];
}
