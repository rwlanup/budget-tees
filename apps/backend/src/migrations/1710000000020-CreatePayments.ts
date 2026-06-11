import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePayments1710000000020 implements MigrationInterface {
  name = 'CreatePayments1710000000020';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "payment_record_status_enum" AS ENUM ('INITIATED','PENDING','SUCCESS','FAILED','CANCELLED','REFUNDED','PARTIALLY_REFUNDED')`,
    );

    await queryRunner.query(`
      CREATE TABLE "payments" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "orderId" uuid NOT NULL REFERENCES "orders"("id") ON DELETE RESTRICT,
        "method" "payment_method_enum" NOT NULL,
        "status" "payment_record_status_enum" NOT NULL DEFAULT 'INITIATED',
        "amount" numeric(12,2) NOT NULL,
        "currency" varchar(3) NOT NULL DEFAULT 'NPR',
        "gatewayRef" varchar(120),
        "gatewayTxnId" varchar(120),
        "idempotencyKey" varchar(80),
        "gatewayResponse" jsonb,
        "initiatedAt" timestamptz,
        "paidAt" timestamptz,
        "failedAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_payments_order" ON "payments" ("orderId")`);
    await queryRunner.query(`CREATE INDEX "idx_payments_status" ON "payments" ("status")`);
    await queryRunner.query(`CREATE INDEX "idx_payments_ref" ON "payments" ("gatewayRef")`);

    await queryRunner.query(`
      CREATE TABLE "payment_refunds" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "paymentId" uuid NOT NULL REFERENCES "payments"("id") ON DELETE RESTRICT,
        "amount" numeric(12,2) NOT NULL,
        "reason" varchar(255) NOT NULL,
        "externalRef" varchar(120),
        "createdBy" uuid,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_refunds_payment" ON "payment_refunds" ("paymentId")`,
    );

    await queryRunner.query(`
      CREATE TABLE "payment_events" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "paymentId" uuid,
        "provider" varchar(20) NOT NULL,
        "type" varchar(60) NOT NULL,
        "payload" jsonb,
        "signatureValid" boolean NOT NULL DEFAULT false,
        "receivedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_payment_events_payment" ON "payment_events" ("paymentId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "payment_events"`);
    await queryRunner.query(`DROP TABLE "payment_refunds"`);
    await queryRunner.query(`DROP TABLE "payments"`);
    await queryRunner.query(`DROP TYPE "payment_record_status_enum"`);
  }
}
