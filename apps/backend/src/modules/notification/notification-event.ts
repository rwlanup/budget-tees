import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationActorType, NotificationType } from './enums/notification.enums';

/** EventEmitter2 channel the NotificationListener subscribes to (mirrors `email.send`). */
export const NOTIFICATION_DISPATCH = 'notification.dispatch';

/**
 * Fire-and-forget notification trigger. Producers emit this from inside business flows
 * (at the same post-commit points the email events use); the NotificationListener resolves
 * recipients, suppresses self-notifications, dedupes, and persists — producers stay decoupled.
 */
export interface NotificationEvent {
  type: NotificationType;
  /** User id that triggered the action; recipients equal to this id are skipped. */
  actorId?: string | null;
  actorType?: NotificationActorType | null;
  order?: {
    id: string;
    orderNumber: string;
    userId: string | null;
    status?: string;
    paymentStatus?: string;
  };
  return?: {
    id: string;
    returnNumber: string;
    userId: string | null;
    status?: string;
    /** For routing the customer to the owning order page. */
    orderNumber?: string;
  };
  contact?: { id: string };
  sku?: { id: string; productId: string; productName: string; code: string; available: number };
}

/** Emit a notification dispatch event onto the global bus. */
export function emitNotification(events: EventEmitter2, event: NotificationEvent): void {
  events.emit(NOTIFICATION_DISPATCH, event);
}
