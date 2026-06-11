import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSales1710000000014 implements MigrationInterface {
  name = 'CreateSales1710000000014';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "sale_type_enum" AS ENUM ('PERCENTAGE','FIXED_AMOUNT')`);
    await queryRunner.query(
      `CREATE TYPE "sale_scope_enum" AS ENUM ('PRODUCTS','CATEGORIES','STORE_WIDE')`,
    );

    await queryRunner.query(`
      CREATE TABLE "sales" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(120) NOT NULL,
        "type" "sale_type_enum" NOT NULL,
        "value" numeric(12,2) NOT NULL,
        "maxDiscountAmount" numeric(12,2),
        "scope" "sale_scope_enum" NOT NULL,
        "startsAt" timestamptz NOT NULL,
        "endsAt" timestamptz NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_sales_window" ON "sales" ("isActive", "startsAt", "endsAt")`,
    );

    await queryRunner.query(`
      CREATE TABLE "sale_products" (
        "saleId" uuid NOT NULL REFERENCES "sales"("id") ON DELETE CASCADE,
        "productId" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
        PRIMARY KEY ("saleId", "productId")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_sale_products_product" ON "sale_products" ("productId")`,
    );

    await queryRunner.query(`
      CREATE TABLE "sale_categories" (
        "saleId" uuid NOT NULL REFERENCES "sales"("id") ON DELETE CASCADE,
        "categoryId" uuid NOT NULL REFERENCES "categories"("id") ON DELETE CASCADE,
        PRIMARY KEY ("saleId", "categoryId")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_sale_categories_category" ON "sale_categories" ("categoryId")`,
    );

    await queryRunner.query(`
      CREATE TABLE "sale_excluded_products" (
        "saleId" uuid NOT NULL REFERENCES "sales"("id") ON DELETE CASCADE,
        "productId" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
        PRIMARY KEY ("saleId", "productId")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_sale_excluded_product" ON "sale_excluded_products" ("productId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "sale_excluded_products"`);
    await queryRunner.query(`DROP TABLE "sale_categories"`);
    await queryRunner.query(`DROP TABLE "sale_products"`);
    await queryRunner.query(`DROP TABLE "sales"`);
    await queryRunner.query(`DROP TYPE "sale_scope_enum"`);
    await queryRunner.query(`DROP TYPE "sale_type_enum"`);
  }
}
