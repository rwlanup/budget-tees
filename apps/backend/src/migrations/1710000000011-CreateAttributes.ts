import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAttributes1710000000011 implements MigrationInterface {
  name = 'CreateAttributes1710000000011';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "attribute_type_enum" AS ENUM ('SELECT','MULTISELECT','TEXT','NUMBER','BOOLEAN','COLOR')`,
    );

    await queryRunner.query(`
      CREATE TABLE "attributes" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" citext NOT NULL,
        "slug" varchar(100) NOT NULL,
        "type" "attribute_type_enum" NOT NULL,
        "isVariation" boolean NOT NULL DEFAULT false,
        "isFilterable" boolean NOT NULL DEFAULT true,
        "sortOrder" int NOT NULL DEFAULT 0,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "uq_attributes_name" ON "attributes" ("name")`);
    await queryRunner.query(`CREATE UNIQUE INDEX "uq_attributes_slug" ON "attributes" ("slug")`);

    await queryRunner.query(`
      CREATE TABLE "attribute_values" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "attributeId" uuid NOT NULL REFERENCES "attributes"("id") ON DELETE CASCADE,
        "value" varchar(120) NOT NULL,
        "slug" varchar(140) NOT NULL,
        "meta" jsonb,
        "sortOrder" int NOT NULL DEFAULT 0,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        UNIQUE ("attributeId", "value"),
        UNIQUE ("attributeId", "slug")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "product_attributes" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "productId" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
        "attributeId" uuid NOT NULL REFERENCES "attributes"("id") ON DELETE RESTRICT,
        "isVariation" boolean NOT NULL DEFAULT false,
        "sortOrder" int NOT NULL DEFAULT 0,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        UNIQUE ("productId", "attributeId")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_product_attributes_product" ON "product_attributes" ("productId")`,
    );

    await queryRunner.query(`
      CREATE TABLE "product_attribute_values" (
        "productAttributeId" uuid NOT NULL REFERENCES "product_attributes"("id") ON DELETE CASCADE,
        "attributeValueId" uuid NOT NULL REFERENCES "attribute_values"("id") ON DELETE RESTRICT,
        PRIMARY KEY ("productAttributeId", "attributeValueId")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_pav_value" ON "product_attribute_values" ("attributeValueId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "product_attribute_values"`);
    await queryRunner.query(`DROP TABLE "product_attributes"`);
    await queryRunner.query(`DROP TABLE "attribute_values"`);
    await queryRunner.query(`DROP TABLE "attributes"`);
    await queryRunner.query(`DROP TYPE "attribute_type_enum"`);
  }
}
