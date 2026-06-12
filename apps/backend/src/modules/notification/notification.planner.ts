import { NotificationActorType, NotificationRecipientType, NotificationType } from './enums/notification.enums';
import { NotificationEvent } from './notification-event';

/** A notification row ready to persist (recipient resolved, self-notification already excluded). */
export interface PlannedNotification {
  recipientType: NotificationRecipientType;
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  route: string;
  actorId: string | null;
  actorType: NotificationActorType | null;
  deduplicationKey: string;
}

const titleCase = (s: string): string =>
  s
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

/** Customer-facing copy for a payment status. */
function paymentCustomerCopy(paymentStatus: string): { title: string; message: string } {
  switch (paymentStatus) {
    case 'PAID':
      return { title: 'Payment received', message: 'Your payment was completed.' };
    case 'FAILED':
      return { title: 'Payment failed', message: 'Your payment could not be completed.' };
    case 'REFUNDED':
    case 'PARTIALLY_REFUNDED':
      return { title: 'Refund processed', message: 'A refund has been processed for your order.' };
    default:
      return { title: 'Payment updated', message: 'Your payment status changed.' };
  }
}

/**
 * Pure mapping of a business event → the notification rows to create. Self-notifications
 * (recipientId === actorId) are filtered here so the rule is enforced centrally. Deduplication
 * is enforced downstream by the DB unique index on (recipientId, deduplicationKey).
 *
 * @param adminIds eligible admin user ids (already filtered by permission + active status).
 */
export function planNotifications(event: NotificationEvent, adminIds: string[]): PlannedNotification[] {
  const actorId = event.actorId ?? null;
  const actorType = event.actorType ?? null;
  const out: PlannedNotification[] = [];

  const base = (recipientType: NotificationRecipientType, recipientId: string, p: Omit<PlannedNotification, 'recipientType' | 'recipientId' | 'type' | 'actorId' | 'actorType'>): void => {
    if (!recipientId || recipientId === actorId) return; // self-notification suppression
    out.push({ recipientType, recipientId, type: event.type, actorId, actorType, ...p });
  };
  const eachAdmin = (p: Omit<PlannedNotification, 'recipientType' | 'recipientId' | 'type' | 'actorId' | 'actorType'>): void => {
    for (const id of adminIds) base(NotificationRecipientType.ADMIN, id, p);
  };
  const customer = (userId: string | null | undefined, p: Omit<PlannedNotification, 'recipientType' | 'recipientId' | 'type' | 'actorId' | 'actorType'>): void => {
    if (userId) base(NotificationRecipientType.CUSTOMER, userId, p);
  };

  switch (event.type) {
    case NotificationType.ORDER_PLACED: {
      const o = event.order;
      if (!o) break;
      eachAdmin({
        title: 'New order received',
        message: `Order ${o.orderNumber} was placed.`,
        relatedEntityType: 'order',
        relatedEntityId: o.id,
        route: `/admin/orders/${o.id}`,
        deduplicationKey: `order-placed:${o.id}`,
      });
      break;
    }
    case NotificationType.ORDER_STATUS_UPDATED: {
      const o = event.order;
      if (!o) break;
      const label = titleCase(o.status ?? '');
      customer(o.userId, {
        title: `Order ${label.toLowerCase()}`,
        message: `Your order ${o.orderNumber} is now ${label.toLowerCase()}.`,
        relatedEntityType: 'order',
        relatedEntityId: o.id,
        route: `/account/orders/${o.orderNumber}`,
        deduplicationKey: `order-status:${o.id}:${o.status}`,
      });
      break;
    }
    case NotificationType.PAYMENT_STATUS_UPDATED: {
      const o = event.order;
      if (!o) break;
      const ps = o.paymentStatus ?? '';
      const cust = paymentCustomerCopy(ps);
      customer(o.userId, {
        ...cust,
        relatedEntityType: 'order',
        relatedEntityId: o.id,
        route: `/account/orders/${o.orderNumber}`,
        deduplicationKey: `payment:${o.id}:${ps}`,
      });
      eachAdmin({
        title: `Payment ${titleCase(ps).toLowerCase()}`,
        message: `Payment for order ${o.orderNumber} is now ${titleCase(ps).toLowerCase()}.`,
        relatedEntityType: 'order',
        relatedEntityId: o.id,
        route: `/admin/orders/${o.id}`,
        deduplicationKey: `payment-admin:${o.id}:${ps}`,
      });
      break;
    }
    case NotificationType.RETURN_CREATED: {
      const r = event.return;
      if (!r) break;
      eachAdmin({
        title: 'Return requested',
        message: `Return ${r.returnNumber} was created.`,
        relatedEntityType: 'return',
        relatedEntityId: r.id,
        route: `/admin/returns/${r.id}`,
        deduplicationKey: `return-created:${r.id}`,
      });
      break;
    }
    case NotificationType.RETURN_CANCELLED: {
      const r = event.return;
      if (!r) break;
      eachAdmin({
        title: 'Return cancelled',
        message: `Return ${r.returnNumber} was cancelled.`,
        relatedEntityType: 'return',
        relatedEntityId: r.id,
        route: `/admin/returns/${r.id}`,
        deduplicationKey: `return-cancelled:${r.id}`,
      });
      break;
    }
    case NotificationType.RETURN_STATUS_UPDATED: {
      const r = event.return;
      if (!r) break;
      const label = titleCase(r.status ?? '');
      customer(r.userId, {
        title: `Return ${label.toLowerCase()}`,
        message: `Your return ${r.returnNumber} is now ${label.toLowerCase()}.`,
        relatedEntityType: 'return',
        relatedEntityId: r.id,
        route: r.orderNumber ? `/account/orders/${r.orderNumber}` : '/account/orders',
        deduplicationKey: `return-status:${r.id}:${r.status}`,
      });
      break;
    }
    case NotificationType.CONTACT_SUBMITTED: {
      const c = event.contact;
      if (!c) break;
      eachAdmin({
        title: 'New contact message',
        message: 'A new contact inquiry was submitted.',
        relatedEntityType: 'contact',
        relatedEntityId: c.id,
        // Admin contact UI is a single list page (no per-message detail route).
        route: '/admin/contact-messages',
        deduplicationKey: `contact:${c.id}`,
      });
      break;
    }
    case NotificationType.LOW_STOCK: {
      const s = event.sku;
      if (!s) break;
      eachAdmin({
        title: 'Low stock',
        message: `${s.productName} (${s.code}) is low — ${s.available} left.`,
        relatedEntityType: 'sku',
        relatedEntityId: s.id,
        route: '/admin/skus',
        deduplicationKey: `low-stock:${s.id}`,
      });
      break;
    }
  }

  return out;
}
