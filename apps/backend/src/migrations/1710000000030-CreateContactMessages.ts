import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateContactMessages1710000000030 implements MigrationInterface {
  name = 'CreateContactMessages1710000000030';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "contact_topic_enum" AS ENUM
        ('ORDER', 'SHIPPING', 'RETURN', 'PRODUCT', 'PAYMENT', 'ACCOUNT', 'FEEDBACK', 'OTHER')
    `);
    await queryRunner.query(`
      CREATE TYPE "contact_status_enum" AS ENUM ('PENDING', 'PROCESSING', 'RESOLVED')
    `);
    await queryRunner.query(`
      CREATE TABLE "contact_messages" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid REFERENCES "users"("id") ON DELETE SET NULL,
        "firstName" varchar(100) NOT NULL,
        "lastName" varchar(100) NOT NULL,
        "email" varchar(180) NOT NULL,
        "phone" varchar(20),
        "topic" "contact_topic_enum" NOT NULL,
        "message" varchar(4000) NOT NULL,
        "status" "contact_status_enum" NOT NULL DEFAULT 'PENDING',
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_contact_user" ON "contact_messages" ("userId")`);
    await queryRunner.query(`CREATE INDEX "idx_contact_status" ON "contact_messages" ("status")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "contact_messages"`);
    await queryRunner.query(`DROP TYPE "contact_status_enum"`);
    await queryRunner.query(`DROP TYPE "contact_topic_enum"`);
  }
}
