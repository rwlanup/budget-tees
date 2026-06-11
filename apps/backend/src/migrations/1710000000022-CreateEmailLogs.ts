import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEmailLogs1710000000022 implements MigrationInterface {
  name = 'CreateEmailLogs1710000000022';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "email_status_enum" AS ENUM ('QUEUED','SENDING','SENT','FAILED','DEAD')`,
    );

    await queryRunner.query(`
      CREATE TABLE "email_logs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "template" varchar(60) NOT NULL,
        "toAddress" varchar(180) NOT NULL,
        "subject" varchar(255) NOT NULL,
        "status" "email_status_enum" NOT NULL DEFAULT 'QUEUED',
        "attempts" int NOT NULL DEFAULT 0,
        "lastError" varchar(500),
        "providerMessageId" varchar(180),
        "refType" varchar(40),
        "refId" uuid,
        "userId" uuid,
        "data" jsonb,
        "sentAt" timestamptz,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_email_logs_status" ON "email_logs" ("status")`);
    await queryRunner.query(`CREATE INDEX "idx_email_logs_template" ON "email_logs" ("template")`);
    await queryRunner.query(
      `CREATE INDEX "idx_email_logs_ref" ON "email_logs" ("refType", "refId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "email_logs"`);
    await queryRunner.query(`DROP TYPE "email_status_enum"`);
  }
}
