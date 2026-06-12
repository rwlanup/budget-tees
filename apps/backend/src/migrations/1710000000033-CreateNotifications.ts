import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotifications1710000000033 implements MigrationInterface {
  name = 'CreateNotifications1710000000033';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "recipientType" varchar(20) NOT NULL,
        "recipientId" uuid NOT NULL,
        "type" varchar(40) NOT NULL,
        "title" varchar(160) NOT NULL,
        "message" varchar(400) NOT NULL,
        "relatedEntityType" varchar(40),
        "relatedEntityId" uuid,
        "route" varchar(300) NOT NULL,
        "isSeen" boolean NOT NULL DEFAULT false,
        "actorId" uuid,
        "actorType" varchar(20),
        "metadata" jsonb,
        "deduplicationKey" varchar(200),
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_notifications_recipient" ON "notifications" ("recipientId", "createdAt")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_notifications_recipient_unseen" ON "notifications" ("recipientId", "isSeen")`,
    );
    // Dedup: one notification per (recipient, logical action) — backs ON CONFLICT DO NOTHING.
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_notifications_dedup" ON "notifications" ("recipientId", "deduplicationKey") WHERE "deduplicationKey" IS NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications"`);
  }
}
