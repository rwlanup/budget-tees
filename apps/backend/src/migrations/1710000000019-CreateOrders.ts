import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOrders1710000000019 implements MigrationInterface {
  name = 'CreateOrders1710000000019';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "order_status_enum" AS ENUM ('PENDING','CONFIRMED','PROCESSING','SHIPPED','DELIVERED','READY_FOR_PICKUP','PICKED_UP','CANCELLED','REFUNDED','RETURNED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "order_payment_status_enum" AS ENUM ('UNPAID','PAID','FAILED','REFUNDED','PARTIALLY_REFUNDED')`,
    );
    await queryRunner.query(`CREATE TYPE "fulfillment_method_enum" AS ENUM ('DELIVERY','PICKUP')`);
    await queryRunner.query(`CREATE TYPE "payment_method_enum" AS ENUM ('ESEWA','KHALTI','COD')`);
    await queryRunner.query(`CREATE SEQUENCE IF NOT EXISTS "order_number_seq" START 1`);

    await queryRunner.query(`
      CREATE TABLE "orders" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "orderNumber" varchar(20) NOT NULL,
        "userId" uuid REFERENCES "users"("id") ON DELETE SET NULL,
        "status" "order_status_enum" NOT NULL DEFAULT 'PENDING',
        "paymentStatus" "order_payment_status_enum" NOT NULL DEFAULT 'UNPAID',
        "fulfillmentMethod" "fulfillment_method_enum" NOT NULL,
        "paymentMethod" "payment_method_enum" NOT NULL,
        "currency" varchar(3) NOT NULL DEFAULT 'NPR',
        "shippingAddress" jsonb,
        "billingAddress" jsonb,
        "pickupLocationId" uuid REFERENCES "pickup_locations"("id") ON DELETE RESTRICT,
        "pickupLocation" jsonb,
        "contactEmail" varchar(180) NOT NULL,
        "contactPhone" varchar(20) NOT NULL,
        "subtotal" numeric(12,2) NOT NULL,
        "discountTotal" numeric(12,2) NOT NULL DEFAULT 0,
        "couponId" uuid,
        "couponCode" varchar(40),
        "shippingCost" numeric(12,2) NOT NULL DEFAULT 0,
        "taxTotal" numeric(12,2) NOT NULL DEFAULT 0,
        "saleSavings" numeric(12,2) NOT NULL DEFAULT 0,
        "grandTotal" numeric(12,2) NOT NULL,
        "customerNote" varchar(500),
        "trackingCarrier" varchar(80),
        "trackingNumber" varchar(120),
        "idempotencyKey" varchar(80),
        "placedAt" timestamptz,
        "paidAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "uq_orders_number" ON "orders" ("orderNumber")`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_orders_idempotency" ON "orders" ("idempotencyKey") WHERE "idempotencyKey" IS NOT NULL`,
    );
    await queryRunner.query(`CREATE INDEX "idx_orders_user" ON "orders" ("userId")`);
    await queryRunner.query(`CREATE INDEX "idx_orders_status" ON "orders" ("status")`);
    await queryRunner.query(
      `CREATE INDEX "idx_orders_payment_status" ON "orders" ("paymentStatus")`,
    );

    await queryRunner.query(`
      CREATE TABLE "order_items" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "orderId" uuid NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
        "skuId" uuid NOT NULL REFERENCES "skus"("id") ON DELETE RESTRICT,
        "productId" uuid NOT NULL,
        "productName" varchar(180) NOT NULL,
        "skuCode" varchar(64) NOT NULL,
        "variant" jsonb,
        "imageUrl" varchar(1024),
        "unitBasePrice" numeric(12,2) NOT NULL,
        "unitPrice" numeric(12,2) NOT NULL,
        "sourceSaleId" uuid,
        "quantity" int NOT NULL,
        "discountAllocated" numeric(12,2) NOT NULL DEFAULT 0,
        "taxAmount" numeric(12,2) NOT NULL DEFAULT 0,
        "taxRateLabel" varchar(60),
        "lineTotal" numeric(12,2) NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_order_items_order" ON "order_items" ("orderId")`);

    await queryRunner.query(`
      CREATE TABLE "order_status_history" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "orderId" uuid NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
        "status" "order_status_enum" NOT NULL,
        "note" varchar(500),
        "changedBy" uuid,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_order_history_order" ON "order_status_history" ("orderId")`,
    );

    // Deferred FK: coupon_redemptions.orderId -> orders.id (column created in m18).
    await queryRunner.query(
      `ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "fk_redemptions_order"
       FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "coupon_redemptions" DROP CONSTRAINT "fk_redemptions_order"`,
    );
    await queryRunner.query(`DROP TABLE "order_status_history"`);
    await queryRunner.query(`DROP TABLE "order_items"`);
    await queryRunner.query(`DROP TABLE "orders"`);
    await queryRunner.query(`DROP SEQUENCE IF EXISTS "order_number_seq"`);
    await queryRunner.query(`DROP TYPE "payment_method_enum"`);
    await queryRunner.query(`DROP TYPE "fulfillment_method_enum"`);
    await queryRunner.query(`DROP TYPE "order_payment_status_enum"`);
    await queryRunner.query(`DROP TYPE "order_status_enum"`);
  }
}
