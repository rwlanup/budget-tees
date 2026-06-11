import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSkuName1710000000024 implements MigrationInterface {
  name = 'AddSkuName1710000000024';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "skus" ADD COLUMN "name" varchar(200)`);
    // Backfill existing rows with the product name as a sensible default.
    await queryRunner.query(`
      UPDATE "skus" s
      SET "name" = p."name"
      FROM "products" p
      WHERE p."id" = s."productId" AND s."name" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "skus" DROP COLUMN "name"`);
  }
}
