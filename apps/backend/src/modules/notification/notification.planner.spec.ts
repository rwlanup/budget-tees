/**
 * Unit tests for the pure notification planner (self-notification suppression, recipient
 * fan-out, routing, dedup keys). Uses the Node built-in test runner so it typechecks and runs
 * without adding a test framework dependency:
 *
 *   pnpm --filter backend exec ts-node --transpile-only --test src/modules/notification/notification.planner.spec.ts
 *   (or `node --import tsx --test ...` once a runner is wired into package.json)
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planNotifications } from './notification.planner';
import { NotificationRecipientType, NotificationType } from './enums/notification.enums';

test('ORDER_PLACED notifies all admins, never the placing customer', () => {
  const plan = planNotifications(
    {
      type: NotificationType.ORDER_PLACED,
      actorId: 'cust1',
      order: { id: 'o1', orderNumber: 'BT-1', userId: 'cust1' },
    },
    ['adminA', 'adminB'],
  );
  assert.equal(plan.length, 2);
  assert.ok(plan.every((n) => n.recipientType === NotificationRecipientType.ADMIN));
  assert.ok(plan.every((n) => n.route === '/admin/orders/o1'));
  assert.ok(plan.every((n) => n.deduplicationKey === 'order-placed:o1'));
});

test('self-notification is suppressed (acting admin excluded)', () => {
  const plan = planNotifications(
    {
      type: NotificationType.ORDER_PLACED,
      actorId: 'adminA',
      order: { id: 'o1', orderNumber: 'BT-1', userId: 'cust1' },
    },
    ['adminA', 'adminB'],
  );
  assert.deepEqual(
    plan.map((n) => n.recipientId),
    ['adminB'],
  );
});

test('admin order status update notifies the customer, routed to their order page', () => {
  const plan = planNotifications(
    {
      type: NotificationType.ORDER_STATUS_UPDATED,
      actorId: 'adminA',
      order: { id: 'o1', orderNumber: 'BT-1', userId: 'cust1', status: 'SHIPPED' },
    },
    [],
  );
  assert.equal(plan.length, 1);
  assert.equal(plan[0].recipientType, NotificationRecipientType.CUSTOMER);
  assert.equal(plan[0].recipientId, 'cust1');
  assert.equal(plan[0].route, '/account/orders/BT-1');
  assert.equal(plan[0].deduplicationKey, 'order-status:o1:SHIPPED');
});

test('a customer cancelling their own order is not self-notified', () => {
  const plan = planNotifications(
    {
      type: NotificationType.ORDER_STATUS_UPDATED,
      actorId: 'cust1',
      order: { id: 'o1', orderNumber: 'BT-1', userId: 'cust1', status: 'CANCELLED' },
    },
    [],
  );
  assert.equal(plan.length, 0);
});

test('payment paid notifies both the customer and admins', () => {
  const plan = planNotifications(
    {
      type: NotificationType.PAYMENT_STATUS_UPDATED,
      order: { id: 'o1', orderNumber: 'BT-1', userId: 'cust1', paymentStatus: 'PAID' },
    },
    ['adminA'],
  );
  assert.equal(plan.length, 2);
  assert.ok(plan.some((n) => n.recipientType === 'CUSTOMER' && n.route === '/account/orders/BT-1'));
  assert.ok(plan.some((n) => n.recipientType === 'ADMIN' && n.route === '/admin/orders/o1'));
});

test('return status update routes the customer to the owning order', () => {
  const plan = planNotifications(
    {
      type: NotificationType.RETURN_STATUS_UPDATED,
      actorId: 'adminA',
      return: {
        id: 'r1',
        returnNumber: 'RET-1',
        userId: 'cust1',
        status: 'APPROVED',
        orderNumber: 'BT-1',
      },
    },
    [],
  );
  assert.equal(plan[0].route, '/account/orders/BT-1');
  assert.equal(plan[0].deduplicationKey, 'return-status:r1:APPROVED');
});

test('no eligible admins -> no notifications', () => {
  const plan = planNotifications(
    {
      type: NotificationType.RETURN_CREATED,
      actorId: 'cust1',
      return: { id: 'r1', returnNumber: 'RET-1', userId: 'cust1' },
    },
    [],
  );
  assert.equal(plan.length, 0);
});

test('low stock alerts admins (except the actor) with a state-free dedup key', () => {
  const plan = planNotifications(
    {
      type: NotificationType.LOW_STOCK,
      actorId: 'adminA',
      sku: { id: 's1', productId: 'p1', productName: 'Tee', code: 'BT-TEE-1', available: 2 },
    },
    ['adminA', 'adminB'],
  );
  assert.deepEqual(
    plan.map((n) => n.recipientId),
    ['adminB'],
  );
  assert.equal(plan[0].route, '/admin/skus');
  assert.equal(plan[0].deduplicationKey, 'low-stock:s1');
});
