import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateLocation1710000000015 implements MigrationInterface {
  name = 'CreateLocation1710000000015';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "address_type_enum" AS ENUM ('SHIPPING','BILLING','BOTH')`,
    );

    await queryRunner.query(`
      CREATE TABLE "user_addresses" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "type" "address_type_enum" NOT NULL DEFAULT 'SHIPPING',
        "label" varchar(40),
        "recipientName" varchar(120) NOT NULL,
        "phone" varchar(20) NOT NULL,
        "email" varchar(180),
        "line1" varchar(180) NOT NULL,
        "line2" varchar(180),
        "city" varchar(100) NOT NULL,
        "region" varchar(100),
        "countryCode" varchar(2) NOT NULL REFERENCES "shipping_countries"("code") ON DELETE RESTRICT,
        "postalCode" varchar(20),
        "nearestLandmark" varchar(180),
        "isDefault" boolean NOT NULL DEFAULT false,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_user_addresses_user" ON "user_addresses" ("userId")`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "uq_user_address_default" ON "user_addresses" ("userId", "type") WHERE "isDefault"`,
    );

    await queryRunner.query(`
      CREATE TABLE "shipping_zones" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(100) NOT NULL,
        "countryCode" varchar(2) NOT NULL REFERENCES "shipping_countries"("code") ON DELETE RESTRICT,
        "isCountryWide" boolean NOT NULL DEFAULT false,
        "flatRate" numeric(12,2) NOT NULL,
        "freeShippingThreshold" numeric(12,2),
        "isActive" boolean NOT NULL DEFAULT true,
        "sortOrder" int NOT NULL DEFAULT 0,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_shipping_zones_country" ON "shipping_zones" ("countryCode")`,
    );

    await queryRunner.query(`
      CREATE TABLE "shipping_zone_regions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "zoneId" uuid NOT NULL REFERENCES "shipping_zones"("id") ON DELETE CASCADE,
        "region" varchar(100) NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_zone_regions_zone" ON "shipping_zone_regions" ("zoneId")`);
    await queryRunner.query(`CREATE INDEX "idx_zone_regions_region" ON "shipping_zone_regions" ("region")`);

    await queryRunner.query(`
      CREATE TABLE "pickup_locations" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(120) NOT NULL,
        "phone" varchar(20),
        "email" varchar(180),
        "line1" varchar(180) NOT NULL,
        "city" varchar(100) NOT NULL,
        "region" varchar(100),
        "countryCode" varchar(2) NOT NULL,
        "postalCode" varchar(20),
        "latitude" numeric(9,6),
        "longitude" numeric(9,6),
        "openingHours" jsonb,
        "isActive" boolean NOT NULL DEFAULT true,
        "sortOrder" int NOT NULL DEFAULT 0,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_pickup_active" ON "pickup_locations" ("isActive")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "pickup_locations"`);
    await queryRunner.query(`DROP TABLE "shipping_zone_regions"`);
    await queryRunner.query(`DROP TABLE "shipping_zones"`);
    await queryRunner.query(`DROP TABLE "user_addresses"`);
    await queryRunner.query(`DROP TYPE "address_type_enum"`);
  }
}
