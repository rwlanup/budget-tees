import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReturns1710000000021 implements MigrationInterface {
  name = 'CreateReturns1710000000021';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "resolution_type_enum" AS ENUM ('REFUND','EXCHANGE')`);
    await queryRunner.query(
      `CREATE TYPE "return_status_enum" AS ENUM ('REQUESTED','APPROVED','REJECTED','AWAITING_ITEMS','RECEIVED','COMPLETED','CANCELLED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "return_reason_enum" AS ENUM ('DAMAGED','WRONG_ITEM','WRONG_SIZE','NOT_AS_DESCRIBED','CHANGED_MIND','OTHER')`,
    );
    await queryRunner.query(
      `CREATE TYPE "item_condition_enum" AS ENUM ('SELLABLE','DAMAGED','UNSELLABLE')`,
    );
    await queryRunner.query(`CREATE SEQUENCE IF NOT EXISTS "return_number_seq" START 1`);

    await queryRunner.query(`
      CREATE TABLE "return_requests" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "returnNumber" varchar(20) NOT NULL,
        "orderId" uuid NOT NULL REFERENCES "orders"("id") ON DELETE RESTRICT,
        "userId" uuid REFERENCES "users"("id") ON DELETE SET NULL,
        "resolutionType" "resolution_type_enum" NOT NULL,
        "status" "return_status_enum" NOT NULL DEFAULT 'REQUESTED',
        "reason" "return_reason_enum" NOT NULL,
        "customerNote" varchar(500),
        "adminNote" varchar(500),
        "refundAmount" numeric(12,2),
        "priceDifference" numeric(12,2),
        "processedBy" uuid,
        "resolvedAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_return_number" ON "return_requests" ("returnNumber")`,
    );
    await queryRunner.query(`CREATE INDEX "idx_returns_order" ON "return_requests" ("orderId")`);
    await queryRunner.query(`CREATE INDEX "idx_returns_user" ON "return_requests" ("userId")`);
    await queryRunner.query(`CREATE INDEX "idx_returns_status" ON "return_requests" ("status")`);

    await queryRunner.query(`
      CREATE TABLE "return_items" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "returnRequestId" uuid NOT NULL REFERENCES "return_requests"("id") ON DELETE CASCADE,
        "orderItemId" uuid NOT NULL REFERENCES "order_items"("id") ON DELETE RESTRICT,
        "skuId" uuid NOT NULL REFERENCES "skus"("id") ON DELETE RESTRICT,
        "quantity" int NOT NULL,
        "exchangeSkuId" uuid REFERENCES "skus"("id") ON DELETE SET NULL,
        "conditionOnReceipt" "item_condition_enum",
        "restock" boolean NOT NULL DEFAULT false,
        "lineRefundAmount" numeric(12,2),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_return_items_request" ON "return_items" ("returnRequestId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_return_items_order_item" ON "return_items" ("orderItemId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "return_items"`);
    await queryRunner.query(`DROP TABLE "return_requests"`);
    await queryRunner.query(`DROP SEQUENCE IF EXISTS "return_number_seq"`);
    await queryRunner.query(`DROP TYPE "item_condition_enum"`);
    await queryRunner.query(`DROP TYPE "return_reason_enum"`);
    await queryRunner.query(`DROP TYPE "return_status_enum"`);
    await queryRunner.query(`DROP TYPE "resolution_type_enum"`);
  }
}
