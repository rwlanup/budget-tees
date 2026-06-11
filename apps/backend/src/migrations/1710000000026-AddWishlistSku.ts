import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWishlistSku1710000000026 implements MigrationInterface {
  name = 'AddWishlistSku1710000000026';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add nullable skuId, backfill from each product's default SKU.
    await queryRunner.query(`ALTER TABLE "wishlist_products" ADD COLUMN "skuId" uuid`);
    await queryRunner.query(`
      UPDATE "wishlist_products" w
      SET "skuId" = p."defaultSkuId"
      FROM "products" p
      WHERE p."id" = w."productId" AND p."defaultSkuId" IS NOT NULL
    `);
    // 2. Drop rows that couldn't be mapped (product had no default SKU).
    await queryRunner.query(`DELETE FROM "wishlist_products" WHERE "skuId" IS NULL`);

    // 3. Swap the uniqueness from (user, product) to (user, sku).
    await queryRunner.query(
      `ALTER TABLE "wishlist_products" DROP CONSTRAINT IF EXISTS "wishlist_products_userId_productId_key"`,
    );
    await queryRunner.query(`ALTER TABLE "wishlist_products" ALTER COLUMN "skuId" SET NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "wishlist_products" ADD CONSTRAINT "fk_wishlist_sku" FOREIGN KEY ("skuId") REFERENCES "skus"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "wishlist_products" ADD CONSTRAINT "uq_wishlist_user_sku" UNIQUE ("userId", "skuId")`,
    );
    await queryRunner.query(`CREATE INDEX "idx_wishlist_sku" ON "wishlist_products" ("skuId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_wishlist_sku"`);
    await queryRunner.query(
      `ALTER TABLE "wishlist_products" DROP CONSTRAINT IF EXISTS "uq_wishlist_user_sku"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wishlist_products" DROP CONSTRAINT IF EXISTS "fk_wishlist_sku"`,
    );
    await queryRunner.query(`ALTER TABLE "wishlist_products" DROP COLUMN "skuId"`);
    // Restore (user, product) uniqueness (best-effort; dups would have to be cleared first).
    await queryRunner.query(
      `ALTER TABLE "wishlist_products" ADD CONSTRAINT "wishlist_products_userId_productId_key" UNIQUE ("userId", "productId")`,
    );
  }
}
