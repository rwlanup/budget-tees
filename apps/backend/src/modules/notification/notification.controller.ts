import { Controller, Get, Param, ParseUUIDPipe, Patch, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { NotificationsService } from './notifications.service';

/**
 * The current user's own notifications. Authentication is enforced by the global JwtAuthGuard;
 * every query is scoped to `recipientId = currentUser.id`, so customers can only see their own
 * rows and admins only their admin rows — no extra permission needed.
 */
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser('id') userId: string, @Query() query: PaginationQueryDto) {
    return this.notifications.list(userId, query);
  }

  @Get('unseen-count')
  unseenCount(@CurrentUser('id') userId: string) {
    return this.notifications.unseenCount(userId);
  }

  @Patch('seen-all')
  markAllSeen(@CurrentUser('id') userId: string) {
    return this.notifications.markAllSeen(userId);
  }

  @Patch(':id/seen')
  markSeen(@CurrentUser('id') userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.notifications.markSeen(id, userId);
  }
}
