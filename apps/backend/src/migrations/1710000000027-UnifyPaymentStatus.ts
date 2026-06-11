import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Unify payment status onto the payments table.
 * - Adds the FK payments.orderId → orders.id (ON DELETE CASCADE) backing the new relation.
 * - Backfills orders.paymentStatus + paidAt as a projection derived from payment rows,
 *   so the denormalized order column matches the (now authoritative) payments ledger.
 */
export class UnifyPaymentStatus1710000000027 implements MigrationInterface {
  name = 'UnifyPaymentStatus1710000000027';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Drop any payment rows orphaned from their order (defensive — keeps the FK valid).
    await queryRunner.query(
      `DELETE FROM "payments" p WHERE NOT EXISTS (SELECT 1 FROM "orders" o WHERE o."id" = p."orderId")`,
    );

    // 2. Add the FK backing Payment.order / Order.payments.
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "fk_payments_order" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE`,
    );

    // 3. Backfill order payment status/paidAt from the payments ledger.
    //    Precedence: REFUNDED > PARTIALLY_REFUNDED > PAID(SUCCESS) > FAILED > UNPAID.
    await queryRunner.query(`
      UPDATE "orders" o
      SET "paymentStatus" = sub.status::"order_payment_status_enum",
          "paidAt" = sub.paid_at
      FROM (
        SELECT
          "orderId",
          CASE
            WHEN bool_or(status = 'REFUNDED') THEN 'REFUNDED'
            WHEN bool_or(status = 'PARTIALLY_REFUNDED') THEN 'PARTIALLY_REFUNDED'
            WHEN bool_or(status = 'SUCCESS') THEN 'PAID'
            WHEN bool_or(status = 'FAILED') THEN 'FAILED'
            ELSE 'UNPAID'
          END AS status,
          max("paidAt") FILTER (
            WHERE status IN ('SUCCESS', 'PARTIALLY_REFUNDED', 'REFUNDED')
          ) AS paid_at
        FROM "payments"
        GROUP BY "orderId"
      ) sub
      WHERE o."id" = sub."orderId"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "fk_payments_order"`);
    // paymentStatus/paidAt backfill is left in place (data, not schema).
  }
}
