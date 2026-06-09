import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAuthTokens1710000000005 implements MigrationInterface {
  name = 'CreateAuthTokens1710000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "verification_token_type_enum" AS ENUM ('EMAIL_VERIFY','PASSWORD_RESET')`,
    );

    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "tokenHash" varchar(255) NOT NULL,
        "familyId" uuid NOT NULL,
        "expiresAt" timestamptz NOT NULL,
        "revokedAt" timestamptz,
        "replacedById" uuid,
        "userAgent" varchar(255),
        "ip" varchar(64),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_refresh_user" ON "refresh_tokens" ("userId")`);
    await queryRunner.query(`CREATE INDEX "idx_refresh_hash" ON "refresh_tokens" ("tokenHash")`);
    await queryRunner.query(`CREATE INDEX "idx_refresh_family" ON "refresh_tokens" ("familyId")`);

    await queryRunner.query(`
      CREATE TABLE "verification_tokens" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "tokenHash" varchar(255) NOT NULL,
        "type" "verification_token_type_enum" NOT NULL,
        "expiresAt" timestamptz NOT NULL,
        "usedAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_verify_hash" ON "verification_tokens" ("tokenHash")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_verify_user_type" ON "verification_tokens" ("userId", "type")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "verification_tokens"`);
    await queryRunner.query(`DROP TABLE "refresh_tokens"`);
    await queryRunner.query(`DROP TYPE "verification_token_type_enum"`);
  }
}
