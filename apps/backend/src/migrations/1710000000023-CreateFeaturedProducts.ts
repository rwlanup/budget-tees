import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFeaturedProducts1710000000023 implements MigrationInterface {
  name = 'CreateFeaturedProducts1710000000023';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "featured_products" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "productId" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
        "sortOrder" int NOT NULL DEFAULT 0,
        "isActive" boolean NOT NULL DEFAULT true,
        "featuredAt" timestamptz,
        "createdBy" uuid,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_featured_product" ON "featured_products" ("productId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_featured_active_sort" ON "featured_products" ("isActive", "sortOrder")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "featured_products"`);
  }
}
