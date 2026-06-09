import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsers1710000000004 implements MigrationInterface {
  name = 'CreateUsers1710000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "user_status_enum" AS ENUM ('PENDING','ACTIVE','SUSPENDED','DEACTIVATED')`,
    );

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" citext NOT NULL,
        "passwordHash" varchar(255) NOT NULL,
        "firstName" varchar(100) NOT NULL,
        "lastName" varchar(100) NOT NULL,
        "roleId" uuid NOT NULL REFERENCES "roles"("id") ON DELETE RESTRICT,
        "status" "user_status_enum" NOT NULL DEFAULT 'PENDING',
        "emailVerifiedAt" timestamptz,
        "avatarMediaId" uuid REFERENCES "media"("id") ON DELETE SET NULL,
        "lastLoginAt" timestamptz,
        "deletedAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    // Email unique only among non-deleted users (soft-deleted emails can be reused).
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_users_email_active" ON "users" ("email") WHERE "deletedAt" IS NULL`,
    );
    await queryRunner.query(`CREATE INDEX "idx_users_role" ON "users" ("roleId")`);
    await queryRunner.query(`CREATE INDEX "idx_users_status" ON "users" ("status")`);
    await queryRunner.query(`CREATE INDEX "idx_users_deleted" ON "users" ("deletedAt")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "user_status_enum"`);
  }
}
