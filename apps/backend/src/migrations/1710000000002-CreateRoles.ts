import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRoles1710000000002 implements MigrationInterface {
  name = 'CreateRoles1710000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "permissions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "key" varchar(100) NOT NULL UNIQUE,
        "description" varchar(255),
        "group" varchar(50) NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_permissions_group" ON "permissions" ("group")`);

    await queryRunner.query(`
      CREATE TABLE "roles" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(50) NOT NULL UNIQUE,
        "description" varchar(255),
        "isSystem" boolean NOT NULL DEFAULT false,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "role_permissions" (
        "roleId" uuid NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
        "permissionId" uuid NOT NULL REFERENCES "permissions"("id") ON DELETE CASCADE,
        PRIMARY KEY ("roleId", "permissionId")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "idx_role_permissions_role" ON "role_permissions" ("roleId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_role_permissions_permission" ON "role_permissions" ("permissionId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "role_permissions"`);
    await queryRunner.query(`DROP TABLE "roles"`);
    await queryRunner.query(`DROP TABLE "permissions"`);
  }
}
