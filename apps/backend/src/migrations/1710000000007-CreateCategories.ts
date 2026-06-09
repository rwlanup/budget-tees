import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCategories1710000000007 implements MigrationInterface {
  name = 'CreateCategories1710000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "categories" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(120) NOT NULL,
        "slug" varchar(140) NOT NULL,
        "description" text,
        "parentId" uuid REFERENCES "categories"("id") ON DELETE RESTRICT,
        "imageMediaId" uuid REFERENCES "media"("id") ON DELETE SET NULL,
        "sortOrder" int NOT NULL DEFAULT 0,
        "isActive" boolean NOT NULL DEFAULT true,
        "metaTitle" varchar(255),
        "metaDescription" varchar(255),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "uq_categories_slug" ON "categories" ("slug")`);
    await queryRunner.query(`CREATE INDEX "idx_categories_parent" ON "categories" ("parentId")`);
    await queryRunner.query(`CREATE INDEX "idx_categories_active" ON "categories" ("isActive")`);
    await queryRunner.query(
      `CREATE INDEX "idx_categories_parent_sort" ON "categories" ("parentId", "sortOrder")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "categories"`);
  }
}
