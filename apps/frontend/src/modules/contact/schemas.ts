import { z } from 'zod';

/** International-friendly phone: digits, spaces, +, -, parens; 7–20 chars. Mirrors backend regex. */
const PHONE_REGEX = /^\+?[\d\s().-]{7,20}$/;

export const CONTACT_TOPICS = [
  'ORDER',
  'SHIPPING',
  'RETURN',
  'PRODUCT',
  'PAYMENT',
  'ACCOUNT',
  'FEEDBACK',
  'OTHER',
] as const;

/** Mirrors backend CreateContactMessageDto. */
export const contactMessageSchema = z.object({
  firstName: z.string().min(1, 'Required').max(100),
  lastName: z.string().min(1, 'Required').max(100),
  email: z.email('Enter a valid email address').max(180),
  phone: z
    .string()
    .regex(PHONE_REGEX, 'Enter a valid phone number')
    .optional()
    .or(z.literal('')),
  topic: z.enum(CONTACT_TOPICS, { message: 'Select a topic' }),
  message: z.string().min(10, 'Please enter at least 10 characters').max(4000),
});
export type ContactMessageInput = z.infer<typeof contactMessageSchema>;

/** Human labels for each topic (UI + admin table). */
export const CONTACT_TOPIC_LABELS: Record<(typeof CONTACT_TOPICS)[number], string> = {
  ORDER: 'Order issue',
  SHIPPING: 'Shipping & delivery',
  RETURN: 'Returns & refunds',
  PRODUCT: 'Product question',
  PAYMENT: 'Payment & billing',
  ACCOUNT: 'Account & login',
  FEEDBACK: 'Feedback & suggestions',
  OTHER: 'Something else',
};
