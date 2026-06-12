export type NotificationRecipientType = 'ADMIN' | 'CUSTOMER';

/** Mirrors the backend Notification entity (per-recipient row). */
export interface AppNotification {
  id: string;
  recipientType: NotificationRecipientType;
  type: string;
  title: string;
  message: string;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  /** Frontend route to open on click. */
  route: string;
  isSeen: boolean;
  createdAt: string;
  updatedAt: string;
}
