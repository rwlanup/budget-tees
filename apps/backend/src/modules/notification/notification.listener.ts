import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from './notifications.service';
import { NOTIFICATION_DISPATCH, NotificationEvent } from './notification-event';

/** Bridges the global event bus to the notification service (mirrors EmailEventListener). */
@Injectable()
export class NotificationListener {
  constructor(private readonly notifications: NotificationsService) {}

  @OnEvent(NOTIFICATION_DISPATCH)
  async handle(event: NotificationEvent): Promise<void> {
    await this.notifications.dispatch(event);
  }
}
