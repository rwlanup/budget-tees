import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCart1710000000016 implements MigrationInterface {
  name = 'CreateCart1710000000016';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "cart_status_enum" AS ENUM ('ACTIVE','CONVERTED','MERGED','ABANDONED')`,
    );

    await queryRunner.query(`
      CREATE TABLE "carts" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid REFERENCES "users"("id") ON DELETE CASCADE,
        "token" varchar(64),
        "status" "cart_status_enum" NOT NULL DEFAULT 'ACTIVE',
        "currency" varchar(3) NOT NULL DEFAULT 'NPR',
        "lastActivityAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_carts_user" ON "carts" ("userId")`);
    await queryRunner.query(`CREATE INDEX "idx_carts_status" ON "carts" ("status")`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_carts_user_active" ON "carts" ("userId") WHERE "status" = 'ACTIVE' AND "userId" IS NOT NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_carts_token_active" ON "carts" ("token") WHERE "status" = 'ACTIVE' AND "token" IS NOT NULL`,
    );

    await queryRunner.query(`
      CREATE TABLE "cart_items" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "cartId" uuid NOT NULL REFERENCES "carts"("id") ON DELETE CASCADE,
        "skuId" uuid NOT NULL REFERENCES "skus"("id") ON DELETE RESTRICT,
        "quantity" int NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        UNIQUE ("cartId", "skuId")
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_cart_items_cart" ON "cart_items" ("cartId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "cart_items"`);
    await queryRunner.query(`DROP TABLE "carts"`);
    await queryRunner.query(`DROP TYPE "cart_status_enum"`);
  }
}
