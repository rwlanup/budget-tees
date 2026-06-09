import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBrands1710000000009 implements MigrationInterface {
  name = 'CreateBrands1710000000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "brands" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" citext NOT NULL,
        "slug" varchar(140) NOT NULL,
        "description" text,
        "logoMediaId" uuid REFERENCES "media"("id") ON DELETE SET NULL,
        "websiteUrl" varchar(255),
        "isActive" boolean NOT NULL DEFAULT true,
        "metaTitle" varchar(255),
        "metaDescription" varchar(255),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "uq_brands_name" ON "brands" ("name")`);
    await queryRunner.query(`CREATE UNIQUE INDEX "uq_brands_slug" ON "brands" ("slug")`);
    await queryRunner.query(`CREATE INDEX "idx_brands_active" ON "brands" ("isActive")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "brands"`);
  }
}
