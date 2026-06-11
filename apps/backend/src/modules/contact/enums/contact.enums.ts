/** Subject categories a customer picks when contacting support. */
export enum ContactTopic {
  ORDER = 'ORDER',
  SHIPPING = 'SHIPPING',
  RETURN = 'RETURN',
  PRODUCT = 'PRODUCT',
  PAYMENT = 'PAYMENT',
  ACCOUNT = 'ACCOUNT',
  FEEDBACK = 'FEEDBACK',
  OTHER = 'OTHER',
}

/** Moderation lifecycle of a contact message. Only admins advance it. */
export enum ContactStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  RESOLVED = 'RESOLVED',
}
