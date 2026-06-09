import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSkus1710000000012 implements MigrationInterface {
  name = 'CreateSkus1710000000012';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "stock_movement_type_enum" AS ENUM ('RESERVE','COMMIT','RELEASE','ADJUST','RESTOCK','RETURN')`,
    );

    await queryRunner.query(`
      CREATE TABLE "skus" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "productId" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
        "sku" varchar(64) NOT NULL,
        "barcode" varchar(64),
        "price" numeric(12,2) NOT NULL,
        "compareAtPrice" numeric(12,2),
        "costPrice" numeric(12,2),
        "stock" int NOT NULL DEFAULT 0,
        "reserved" int NOT NULL DEFAULT 0,
        "lowStockThreshold" int NOT NULL DEFAULT 0,
        "allowBackorder" boolean NOT NULL DEFAULT false,
        "weightGrams" int,
        "imageMediaId" uuid REFERENCES "media"("id") ON DELETE SET NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "isDefault" boolean NOT NULL DEFAULT false,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "chk_sku_stock_nonneg" CHECK ("stock" >= 0),
        CONSTRAINT "chk_sku_reserved_nonneg" CHECK ("reserved" >= 0)
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "uq_skus_sku" ON "skus" ("sku")`);
    await queryRunner.query(`CREATE INDEX "idx_skus_product" ON "skus" ("productId")`);
    await queryRunner.query(
      `CREATE INDEX "idx_skus_product_active" ON "skus" ("productId", "isActive")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_skus_default" ON "skus" ("productId") WHERE "isDefault"`,
    );

    await queryRunner.query(`
      CREATE TABLE "sku_attribute_values" (
        "skuId" uuid NOT NULL REFERENCES "skus"("id") ON DELETE CASCADE,
        "attributeValueId" uuid NOT NULL REFERENCES "attribute_values"("id") ON DELETE RESTRICT,
        PRIMARY KEY ("skuId", "attributeValueId")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_sav_value" ON "sku_attribute_values" ("attributeValueId")`,
    );

    await queryRunner.query(`
      CREATE TABLE "stock_movements" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "skuId" uuid NOT NULL REFERENCES "skus"("id") ON DELETE CASCADE,
        "type" "stock_movement_type_enum" NOT NULL,
        "qty" int NOT NULL,
        "reason" varchar(255),
        "refType" varchar(40),
        "refId" uuid,
        "createdBy" uuid,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_stock_movements_sku" ON "stock_movements" ("skuId")`,
    );

    // Deferred FK from products.defaultSkuId -> skus.id (column created in m10).
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "fk_products_default_sku"
       FOREIGN KEY ("defaultSkuId") REFERENCES "skus"("id") ON DELETE SET NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "fk_products_default_sku"`);
    await queryRunner.query(`DROP TABLE "stock_movements"`);
    await queryRunner.query(`DROP TABLE "sku_attribute_values"`);
    await queryRunner.query(`DROP TABLE "skus"`);
    await queryRunner.query(`DROP TYPE "stock_movement_type_enum"`);
  }
}
