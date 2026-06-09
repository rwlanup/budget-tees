import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTags1710000000008 implements MigrationInterface {
  name = 'CreateTags1710000000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "tags" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" citext NOT NULL,
        "slug" varchar(80) NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "uq_tags_name" ON "tags" ("name")`);
    await queryRunner.query(`CREATE UNIQUE INDEX "uq_tags_slug" ON "tags" ("slug")`);
    await queryRunner.query(`CREATE INDEX "idx_tags_active" ON "tags" ("isActive")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "tags"`);
  }
}
