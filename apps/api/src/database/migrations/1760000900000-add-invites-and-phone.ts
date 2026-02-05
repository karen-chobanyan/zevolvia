import { MigrationInterface, QueryRunner } from "typeorm";

export class AddInvitesAndPhone1760000900000 implements MigrationInterface {
  name = "AddInvitesAndPhone1760000900000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add phone column to users table
    await queryRunner.query(`
      ALTER TABLE "users" ADD COLUMN "phone" text;
    `);

    // Create invites table
    await queryRunner.query(`
      CREATE TABLE "invites" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "org_id" uuid NOT NULL REFERENCES "orgs"("id") ON DELETE CASCADE,
        "email" text NOT NULL,
        "name" text,
        "phone" text,
        "role_id" uuid NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
        "invited_by_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
        "token" text NOT NULL UNIQUE,
        "expires_at" timestamptz NOT NULL,
        "status" text NOT NULL DEFAULT 'pending',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "invites_org_email_idx" ON "invites" ("org_id", "email");
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "invites_token_idx" ON "invites" ("token");
    `);

    // Add org management permissions
    await queryRunner.query(`
      INSERT INTO "permissions" ("key", "description") VALUES
        ('org:members:read', 'View organization members'),
        ('org:members:write', 'Invite and manage organization members'),
        ('org:members:delete', 'Remove members from organization')
      ON CONFLICT ("key") DO NOTHING;
    `);

    // Grant org permissions to Admin role
    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r.id, p.id
      FROM "roles" r
      CROSS JOIN "permissions" p
      WHERE r.name = 'Admin'
        AND p.key IN (
          'org:members:read', 'org:members:write', 'org:members:delete'
        )
      ON CONFLICT DO NOTHING;
    `);

    // Grant read permission to Member role
    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r.id, p.id
      FROM "roles" r
      CROSS JOIN "permissions" p
      WHERE r.name = 'Member'
        AND p.key IN ('org:members:read')
      ON CONFLICT DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove role permissions
    await queryRunner.query(`
      DELETE FROM "role_permissions"
      WHERE "permission_id" IN (
        SELECT id FROM "permissions"
        WHERE key IN (
          'org:members:read', 'org:members:write', 'org:members:delete'
        )
      );
    `);

    // Remove permissions
    await queryRunner.query(`
      DELETE FROM "permissions"
      WHERE key IN (
        'org:members:read', 'org:members:write', 'org:members:delete'
      );
    `);

    // Drop invites table
    await queryRunner.query(`DROP INDEX IF EXISTS "invites_token_idx";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "invites_org_email_idx";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "invites";`);

    // Remove phone column from users
    await queryRunner.query(`
      ALTER TABLE "users" DROP COLUMN IF EXISTS "phone";
    `);
  }
}
