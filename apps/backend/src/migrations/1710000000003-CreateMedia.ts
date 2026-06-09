import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMedia1710000000003 implements MigrationInterface {
  name = 'CreateMedia1710000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "media_type_enum" AS ENUM ('IMAGE','VIDEO','DOCUMENT')`,
    );
    await queryRunner.query(
      `CREATE TYPE "media_status_enum" AS ENUM ('PROCESSING','READY','FAILED')`,
    );
    await queryRunner.query(
      `CREATE TYPE "media_variant_enum" AS ENUM ('THUMB','MEDIUM','LARGE','WEBP')`,
    );

    await queryRunner.query(`
      CREATE TABLE "media" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "type" "media_type_enum" NOT NULL DEFAULT 'IMAGE',
        "originalName" varchar(255) NOT NULL,
        "mimeType" varchar(100) NOT NULL,
        "sizeBytes" bigint NOT NULL,
        "storageKey" varchar(512) NOT NULL,
        "url" varchar(1024) NOT NULL,
        "width" int,
        "height" int,
        "altText" varchar(255),
        "driver" varchar(20) NOT NULL,
        "status" "media_status_enum" NOT NULL DEFAULT 'PROCESSING',
        "uploadedBy" uuid,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_media_status" ON "media" ("status")`);

    await queryRunner.query(`
      CREATE TABLE "media_variants" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "mediaId" uuid NOT NULL REFERENCES "media"("id") ON DELETE CASCADE,
        "variant" "media_variant_enum" NOT NULL,
        "storageKey" varchar(512) NOT NULL,
        "url" varchar(1024) NOT NULL,
        "width" int NOT NULL,
        "height" int NOT NULL,
        "sizeBytes" bigint NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        UNIQUE ("mediaId", "variant")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_media_variants_media" ON "media_variants" ("mediaId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "media_variants"`);
    await queryRunner.query(`DROP TABLE "media"`);
    await queryRunner.query(`DROP TYPE "media_variant_enum"`);
    await queryRunner.query(`DROP TYPE "media_status_enum"`);
    await queryRunner.query(`DROP TYPE "media_type_enum"`);
  }
}
