import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { ContactStatus, ContactTopic } from '../enums/contact.enums';

/** International-friendly phone: digits, spaces, +, -, parens; 7–20 chars. */
const PHONE_REGEX = /^\+?[\d\s().-]{7,20}$/;

export class CreateContactMessageDto {
  @IsString()
  @Length(1, 100)
  firstName: string;

  @IsString()
  @Length(1, 100)
  lastName: string;

  @IsEmail({}, { message: 'Enter a valid email address' })
  @Length(1, 180)
  email: string;

  @IsOptional()
  @IsString()
  @Matches(PHONE_REGEX, { message: 'Enter a valid phone number' })
  phone?: string;

  @IsEnum(ContactTopic)
  topic: ContactTopic;

  @IsString()
  @Length(10, 4000)
  message: string;
}

export class AdminListContactQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(ContactStatus)
  status?: ContactStatus;

  @IsOptional()
  @IsEnum(ContactTopic)
  topic?: ContactTopic;
}

export class SetContactStatusDto {
  @IsEnum(ContactStatus)
  status: ContactStatus;
}
