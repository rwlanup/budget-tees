import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSettings1710000000001 implements MigrationInterface {
  name = 'CreateSettings1710000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Extensions used across the schema (first migration sets them up).
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`); // gen_random_uuid()
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "citext"`); // case-insensitive text
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pg_trgm"`); // fuzzy search

    await queryRunner.query(`
      CREATE TYPE "setting_type_enum" AS ENUM ('STRING','NUMBER','BOOLEAN','JSON','STRING_ARRAY')
    `);

    await queryRunner.query(`
      CREATE TABLE "settings" (
        "key" varchar(120) PRIMARY KEY,
        "value" jsonb NOT NULL,
        "type" "setting_type_enum" NOT NULL,
        "group" varchar(50) NOT NULL,
        "description" varchar(255),
        "isPublic" boolean NOT NULL DEFAULT false,
        "updatedBy" uuid,
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_settings_group" ON "settings" ("group")`);

    await queryRunner.query(`
      CREATE TABLE "shipping_countries" (
        "code" varchar(2) PRIMARY KEY,
        "name" varchar(100) NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "sortOrder" int NOT NULL DEFAULT 0,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_shipping_countries_active" ON "shipping_countries" ("isActive")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "shipping_countries"`);
    await queryRunner.query(`DROP TABLE "settings"`);
    await queryRunner.query(`DROP TYPE "setting_type_enum"`);
  }
}
