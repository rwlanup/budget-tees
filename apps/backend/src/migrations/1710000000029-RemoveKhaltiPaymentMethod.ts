import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Remove KHALTI from payment_method_enum (shared by orders.paymentMethod + payments.method).
 * Postgres can't drop an enum value in place, so the type is recreated.
 * Note: the USING casts fail if any KHALTI rows still exist — handle/migrate those first.
 */
export class RemoveKhaltiPaymentMethod1710000000029 implements MigrationInterface {
  name = 'RemoveKhaltiPaymentMethod1710000000029';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "payment_method_enum" RENAME TO "payment_method_enum_old"`);
    await queryRunner.query(`CREATE TYPE "payment_method_enum" AS ENUM ('ESEWA','COD')`);
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "paymentMethod" TYPE "payment_method_enum" USING "paymentMethod"::text::"payment_method_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ALTER COLUMN "method" TYPE "payment_method_enum" USING "method"::text::"payment_method_enum"`,
    );
    await queryRunner.query(`DROP TYPE "payment_method_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE "payment_method_enum" RENAME TO "payment_method_enum_old"`);
    await queryRunner.query(`CREATE TYPE "payment_method_enum" AS ENUM ('ESEWA','KHALTI','COD')`);
    await queryRunner.query(
      `ALTER TABLE "orders" ALTER COLUMN "paymentMethod" TYPE "payment_method_enum" USING "paymentMethod"::text::"payment_method_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ALTER COLUMN "method" TYPE "payment_method_enum" USING "method"::text::"payment_method_enum"`,
    );
    await queryRunner.query(`DROP TYPE "payment_method_enum_old"`);
  }
}
