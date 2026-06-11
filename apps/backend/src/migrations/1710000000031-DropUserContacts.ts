import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropUserContacts1710000000031 implements MigrationInterface {
  name = 'DropUserContacts1710000000031';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "user_phones"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_emails"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "user_emails" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "email" citext NOT NULL,
        "label" varchar(30),
        "isPrimary" boolean NOT NULL DEFAULT false,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        UNIQUE ("userId", "email")
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_user_emails_user" ON "user_emails" ("userId")`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_user_email_primary" ON "user_emails" ("userId") WHERE "isPrimary"`,
    );

    await queryRunner.query(`
      CREATE TABLE "user_phones" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "e164" varchar(20) NOT NULL,
        "countryCode" varchar(2),
        "label" varchar(30),
        "isPrimary" boolean NOT NULL DEFAULT false,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        UNIQUE ("userId", "e164")
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_user_phones_user" ON "user_phones" ("userId")`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_user_phone_primary" ON "user_phones" ("userId") WHERE "isPrimary"`,
    );
  }
}
