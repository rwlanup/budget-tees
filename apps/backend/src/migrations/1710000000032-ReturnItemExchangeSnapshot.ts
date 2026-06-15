import { MigrationInterface, QueryRunner } from 'typeorm';

export class ReturnItemExchangeSnapshot1710000000032 implements MigrationInterface {
  name = 'ReturnItemExchangeSnapshot1710000000032';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "return_items" ADD COLUMN IF NOT EXISTS "exchangeSku" jsonb`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "return_items" DROP COLUMN IF EXISTS "exchangeSku"`);
  }
}
