export type ResolutionType = 'REFUND' | 'EXCHANGE';
export type ReturnStatus =
  | 'REQUESTED'
  | 'APPROVED'
  | 'REJECTED'
  | 'AWAITING_ITEMS'
  | 'RECEIVED'
  | 'COMPLETED'
  | 'CANCELLED';
export type ReturnReason =
  | 'DAMAGED'
  | 'WRONG_ITEM'
  | 'WRONG_SIZE'
  | 'NOT_AS_DESCRIBED'
  | 'CHANGED_MIND'
  | 'OTHER';
export type ItemCondition = 'SELLABLE' | 'DAMAGED' | 'UNSELLABLE';

export const RETURN_STATUSES: ReturnStatus[] = [
  'REQUESTED',
  'APPROVED',
  'REJECTED',
  'AWAITING_ITEMS',
  'RECEIVED',
  'COMPLETED',
  'CANCELLED',
];
export const ITEM_CONDITIONS: ItemCondition[] = ['SELLABLE', 'DAMAGED', 'UNSELLABLE'];

/** Customer-facing reason options (value → label). */
export const RETURN_REASONS: { value: ReturnReason; label: string }[] = [
  { value: 'DAMAGED', label: 'Arrived damaged' },
  { value: 'WRONG_ITEM', label: 'Wrong item sent' },
  { value: 'WRONG_SIZE', label: 'Wrong size' },
  { value: 'NOT_AS_DESCRIBED', label: 'Not as described' },
  { value: 'CHANGED_MIND', label: 'Changed my mind' },
  { value: 'OTHER', label: 'Other' },
];

/** Order statuses where a customer return may be requested (mirrors backend eligibility). */
export const RETURNABLE_ORDER_STATUSES = ['DELIVERED', 'PICKED_UP'] as const;

/** Customer can cancel a return only while still REQUESTED. */
export const CANCELLABLE_RETURN_STATUSES: ReturnStatus[] = ['REQUESTED'];

export interface ReturnItem {
  id: string;
  orderItemId: string;
  skuId: string;
  quantity: number;
  exchangeSkuId: string | null;
  conditionOnReceipt: ItemCondition | null;
  restock: boolean;
  lineRefundAmount: number | null;
}

/** Mirrors backend ReturnRequest entity (items eager). */
export interface ReturnRequest {
  id: string;
  returnNumber: string;
  orderId: string;
  userId: string | null;
  resolutionType: ResolutionType;
  status: ReturnStatus;
  reason: ReturnReason;
  customerNote: string | null;
  adminNote: string | null;
  refundAmount: number | null;
  priceDifference: number | null;
  resolvedAt: string | null;
  items: ReturnItem[];
  createdAt: string;
  updatedAt: string;
}
