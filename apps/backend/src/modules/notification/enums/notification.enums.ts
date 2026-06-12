/** Who a notification is for. Fan-out creates one row per recipient user. */
export enum NotificationRecipientType {
  ADMIN = 'ADMIN',
  CUSTOMER = 'CUSTOMER',
}

/** Who triggered the action (for self-notification suppression + display). */
export enum NotificationActorType {
  ADMIN = 'ADMIN',
  CUSTOMER = 'CUSTOMER',
  SYSTEM = 'SYSTEM',
}

/** The business event a notification represents. */
export enum NotificationType {
  ORDER_PLACED = 'ORDER_PLACED', // admin
  ORDER_STATUS_UPDATED = 'ORDER_STATUS_UPDATED', // customer
  PAYMENT_STATUS_UPDATED = 'PAYMENT_STATUS_UPDATED', // customer + admin
  RETURN_CREATED = 'RETURN_CREATED', // admin
  RETURN_CANCELLED = 'RETURN_CANCELLED', // admin
  RETURN_STATUS_UPDATED = 'RETURN_STATUS_UPDATED', // customer
  CONTACT_SUBMITTED = 'CONTACT_SUBMITTED', // admin
  LOW_STOCK = 'LOW_STOCK', // admin
}
