import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './entities/notification.entity';
import { User } from '../user/entities/user.entity';
import { NotificationsService } from './notifications.service';
import { NotificationListener } from './notification.listener';
import { NotificationController } from './notification.controller';

/**
 * Self-contained: consumes domain events off the global bus (no business module imports it),
 * and reads the User table directly to fan admin notifications out by permission.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Notification, User])],
  controllers: [NotificationController],
  providers: [NotificationsService, NotificationListener],
})
export class NotificationModule {}
