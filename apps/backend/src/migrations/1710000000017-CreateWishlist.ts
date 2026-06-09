import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWishlist1710000000017 implements MigrationInterface {
  name = 'CreateWishlist1710000000017';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "wishlist_products" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "productId" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
        "addedAt" timestamptz NOT NULL DEFAULT now(),
        UNIQUE ("userId", "productId")
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_wishlist_user" ON "wishlist_products" ("userId")`);
    await queryRunner.query(`CREATE INDEX "idx_wishlist_product" ON "wishlist_products" ("productId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "wishlist_products"`);
  }
}
