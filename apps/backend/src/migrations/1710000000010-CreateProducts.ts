import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProducts1710000000010 implements MigrationInterface {
  name = 'CreateProducts1710000000010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "product_type_enum" AS ENUM ('SIMPLE','VARIABLE')`);
    await queryRunner.query(
      `CREATE TYPE "product_status_enum" AS ENUM ('DRAFT','PUBLISHED','ARCHIVED')`,
    );

    await queryRunner.query(`
      CREATE TABLE "products" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(180) NOT NULL,
        "slug" varchar(200) NOT NULL,
        "shortDescription" varchar(500),
        "description" text,
        "categoryId" uuid NOT NULL REFERENCES "categories"("id") ON DELETE RESTRICT,
        "brandId" uuid REFERENCES "brands"("id") ON DELETE RESTRICT,
        "taxClassId" uuid,
        "type" "product_type_enum" NOT NULL DEFAULT 'SIMPLE',
        "status" "product_status_enum" NOT NULL DEFAULT 'DRAFT',
        "defaultSkuId" uuid,
        "publishedAt" timestamptz,
        "metaTitle" varchar(255),
        "metaDescription" varchar(255),
        "deletedAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_products_slug_active" ON "products" ("slug") WHERE "deletedAt" IS NULL`,
    );
    await queryRunner.query(`CREATE INDEX "idx_products_category" ON "products" ("categoryId")`);
    await queryRunner.query(`CREATE INDEX "idx_products_brand" ON "products" ("brandId")`);
    await queryRunner.query(`CREATE INDEX "idx_products_status" ON "products" ("status")`);
    await queryRunner.query(
      `CREATE INDEX "idx_products_name_trgm" ON "products" USING gin ("name" gin_trgm_ops)`,
    );

    await queryRunner.query(`
      CREATE TABLE "product_tags" (
        "productId" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
        "tagId" uuid NOT NULL REFERENCES "tags"("id") ON DELETE CASCADE,
        PRIMARY KEY ("productId", "tagId")
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_product_tags_tag" ON "product_tags" ("tagId")`);

    await queryRunner.query(`
      CREATE TABLE "product_media" (
        "productId" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
        "mediaId" uuid NOT NULL REFERENCES "media"("id") ON DELETE RESTRICT,
        "sortOrder" int NOT NULL DEFAULT 0,
        "isPrimary" boolean NOT NULL DEFAULT false,
        PRIMARY KEY ("productId", "mediaId")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_product_media_primary" ON "product_media" ("productId") WHERE "isPrimary"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "product_media"`);
    await queryRunner.query(`DROP TABLE "product_tags"`);
    await queryRunner.query(`DROP TABLE "products"`);
    await queryRunner.query(`DROP TYPE "product_status_enum"`);
    await queryRunner.query(`DROP TYPE "product_type_enum"`);
  }
}
