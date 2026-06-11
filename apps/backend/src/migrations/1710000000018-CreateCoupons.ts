import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCoupons1710000000018 implements MigrationInterface {
  name = 'CreateCoupons1710000000018';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "coupon_type_enum" AS ENUM ('PERCENTAGE','FIXED','FREE_SHIPPING')`,
    );
    await queryRunner.query(
      `CREATE TYPE "coupon_applies_to_enum" AS ENUM ('ALL','PRODUCTS','CATEGORIES')`,
    );
    await queryRunner.query(`CREATE TYPE "redemption_status_enum" AS ENUM ('APPLIED','REVERSED')`);

    await queryRunner.query(`
      CREATE TABLE "coupons" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "code" citext NOT NULL,
        "description" varchar(255),
        "type" "coupon_type_enum" NOT NULL,
        "value" numeric(12,2),
        "maxDiscountAmount" numeric(12,2),
        "minOrderAmount" numeric(12,2),
        "appliesTo" "coupon_applies_to_enum" NOT NULL DEFAULT 'ALL',
        "firstOrderOnly" boolean NOT NULL DEFAULT false,
        "usageLimit" int,
        "usageLimitPerUser" int DEFAULT 1,
        "usedCount" int NOT NULL DEFAULT 0,
        "startsAt" timestamptz,
        "endsAt" timestamptz,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "uq_coupons_code" ON "coupons" ("code")`);
    await queryRunner.query(`CREATE INDEX "idx_coupons_active" ON "coupons" ("isActive")`);

    await queryRunner.query(`
      CREATE TABLE "coupon_products" (
        "couponId" uuid NOT NULL REFERENCES "coupons"("id") ON DELETE CASCADE,
        "productId" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
        PRIMARY KEY ("couponId", "productId")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_coupon_products_product" ON "coupon_products" ("productId")`,
    );

    await queryRunner.query(`
      CREATE TABLE "coupon_categories" (
        "couponId" uuid NOT NULL REFERENCES "coupons"("id") ON DELETE CASCADE,
        "categoryId" uuid NOT NULL REFERENCES "categories"("id") ON DELETE CASCADE,
        PRIMARY KEY ("couponId", "categoryId")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_coupon_categories_category" ON "coupon_categories" ("categoryId")`,
    );

    await queryRunner.query(`
      CREATE TABLE "coupon_redemptions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "couponId" uuid NOT NULL REFERENCES "coupons"("id") ON DELETE RESTRICT,
        "userId" uuid REFERENCES "users"("id") ON DELETE SET NULL,
        "orderId" uuid NOT NULL,
        "discountAmount" numeric(12,2) NOT NULL,
        "status" "redemption_status_enum" NOT NULL DEFAULT 'APPLIED',
        "redeemedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_redemptions_coupon" ON "coupon_redemptions" ("couponId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_redemptions_user" ON "coupon_redemptions" ("userId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_redemptions_order" ON "coupon_redemptions" ("orderId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "coupon_redemptions"`);
    await queryRunner.query(`DROP TABLE "coupon_categories"`);
    await queryRunner.query(`DROP TABLE "coupon_products"`);
    await queryRunner.query(`DROP TABLE "coupons"`);
    await queryRunner.query(`DROP TYPE "redemption_status_enum"`);
    await queryRunner.query(`DROP TYPE "coupon_applies_to_enum"`);
    await queryRunner.query(`DROP TYPE "coupon_type_enum"`);
  }
}
