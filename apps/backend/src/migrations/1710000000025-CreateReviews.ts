import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReviews1710000000025 implements MigrationInterface {
  name = 'CreateReviews1710000000025';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "review_status_enum" AS ENUM ('PUBLISHED', 'HIDDEN')
    `);
    await queryRunner.query(`
      CREATE TABLE "product_reviews" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "productId" uuid NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
        "userId" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "orderId" uuid REFERENCES "orders"("id") ON DELETE SET NULL,
        "rating" smallint NOT NULL,
        "title" varchar(120),
        "body" varchar(2000),
        "status" "review_status_enum" NOT NULL DEFAULT 'PUBLISHED',
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "chk_review_rating" CHECK ("rating" BETWEEN 1 AND 5),
        CONSTRAINT "uq_review_user_product" UNIQUE ("userId", "productId")
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_review_product" ON "product_reviews" ("productId")`);
    await queryRunner.query(`CREATE INDEX "idx_review_user" ON "product_reviews" ("userId")`);
    await queryRunner.query(`CREATE INDEX "idx_review_status" ON "product_reviews" ("status")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "product_reviews"`);
    await queryRunner.query(`DROP TYPE "review_status_enum"`);
  }
}
