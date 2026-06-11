import type { Paginated } from '@/types/api';

export type ContactTopic =
  | 'ORDER'
  | 'SHIPPING'
  | 'RETURN'
  | 'PRODUCT'
  | 'PAYMENT'
  | 'ACCOUNT'
  | 'FEEDBACK'
  | 'OTHER';

export type ContactStatus = 'PENDING' | 'PROCESSING' | 'RESOLVED';

/** Mirrors backend `ContactMessage` entity. */
export interface ContactMessage {
  id: string;
  userId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  topic: ContactTopic;
  message: string;
  status: ContactStatus;
  createdAt: string;
  updatedAt: string;
}

export type ContactMessageList = Paginated<ContactMessage>;
