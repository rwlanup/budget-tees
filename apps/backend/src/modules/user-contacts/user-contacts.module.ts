import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEmail } from './entities/user-email.entity';
import { UserPhone } from './entities/user-phone.entity';
import { UserEmailsService } from './services/user-emails.service';
import { UserPhonesService } from './services/user-phones.service';
import {
  AdminUserEmailsController,
  MeEmailsController,
} from './controllers/user-emails.controller';
import {
  AdminUserPhonesController,
  MePhonesController,
} from './controllers/user-phones.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserEmail, UserPhone])],
  controllers: [
    MeEmailsController,
    AdminUserEmailsController,
    MePhonesController,
    AdminUserPhonesController,
  ],
  providers: [UserEmailsService, UserPhonesService],
  exports: [UserEmailsService, UserPhonesService],
})
export class UserContactsModule {}
