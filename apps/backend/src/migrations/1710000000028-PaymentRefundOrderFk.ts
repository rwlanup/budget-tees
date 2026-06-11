import { MigrationInterface, QueryRunner } from 'typeorm';

/** Add the FK payment_refunds.paymentId → payments.id backing the Payment.refunds relation. */
export class PaymentRefundFk1710000000028 implements MigrationInterface {
  name = 'PaymentRefundFk1710000000028';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "payment_refunds" r WHERE NOT EXISTS (SELECT 1 FROM "payments" p WHERE p."id" = r."paymentId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "payment_refunds" ADD CONSTRAINT "fk_payment_refunds_payment" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "payment_refunds" DROP CONSTRAINT IF EXISTS "fk_payment_refunds_payment"`,
    );
  }
}
