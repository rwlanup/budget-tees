import { EventEmitter2 } from '@nestjs/event-emitter';

export interface EmailEventPayload {
  template: string;
  to: string;
  data?: Record<string, unknown>;
  refType?: string;
  refId?: string;
  userId?: string | null;
}

/**
 * Fire-and-forget transactional email trigger. The Email module's
 * `@OnEvent('email.send')` listener enqueues it — producers stay decoupled.
 */
export function emitEmail(events: EventEmitter2, payload: EmailEventPayload): void {
  events.emit('email.send', { ...payload, userId: payload.userId ?? undefined });
}
