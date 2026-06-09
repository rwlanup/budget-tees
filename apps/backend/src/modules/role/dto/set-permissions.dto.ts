import { ArrayNotEmpty, ArrayUnique, IsArray, IsString } from 'class-validator';

export class SetPermissionsDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsString({ each: true })
  permissionKeys: string[];
}
