import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateMediaDto {
  @IsOptional()
  @IsString()
  @Length(0, 255)
  altText?: string;
}
