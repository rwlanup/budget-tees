import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTax1710000000013 implements MigrationInterface {
  name = 'CreateTax1710000000013';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "tax_classes" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(80) NOT NULL,
        "slug" varchar(100) NOT NULL,
        "isDefault" boolean NOT NULL DEFAULT false,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "uq_tax_classes_name" ON "tax_classes" ("name")`);
    await queryRunner.query(`CREATE UNIQUE INDEX "uq_tax_classes_slug" ON "tax_classes" ("slug")`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_tax_classes_default" ON "tax_classes" ("isDefault") WHERE "isDefault"`,
    );

    await queryRunner.query(`
      CREATE TABLE "tax_rates" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "taxClassId" uuid NOT NULL REFERENCES "tax_classes"("id") ON DELETE CASCADE,
        "name" varchar(60) NOT NULL,
        "countryCode" varchar(2) NOT NULL REFERENCES "shipping_countries"("code") ON DELETE RESTRICT,
        "rate" numeric(5,2) NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        UNIQUE ("taxClassId", "countryCode")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_tax_rates_lookup" ON "tax_rates" ("countryCode", "taxClassId", "isActive")`,
    );

    // Deferred FK: products.taxClassId -> tax_classes.id (column created in m10).
    await queryRunner.query(
      `ALTER TABLE "products" ADD CONSTRAINT "fk_products_tax_class"
       FOREIGN KEY ("taxClassId") REFERENCES "tax_classes"("id") ON DELETE SET NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "fk_products_tax_class"`);
    await queryRunner.query(`DROP TABLE "tax_rates"`);
    await queryRunner.query(`DROP TABLE "tax_classes"`);
  }
}
