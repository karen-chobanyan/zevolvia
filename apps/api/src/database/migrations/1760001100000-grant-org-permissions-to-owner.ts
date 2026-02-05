import { MigrationInterface, QueryRunner } from "typeorm";

export class GrantOrgPermissionsToOwner1760001100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ensure org:members permissions exist
    await queryRunner.query(`
      INSERT INTO "permissions" ("key", "description") VALUES
        ('org:members:read', 'View organization members'),
        ('org:members:write', 'Invite and manage organization members'),
        ('org:members:delete', 'Remove members from organization')
      ON CONFLICT ("key") DO NOTHING;
    `);

    // Grant org permissions to Owner role
    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r.id, p.id
      FROM "roles" r
      CROSS JOIN "permissions" p
      WHERE r.name = 'Owner'
        AND p.key IN (
          'org:members:read', 'org:members:write', 'org:members:delete'
        )
      ON CONFLICT DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "role_permissions"
      WHERE "role_id" IN (SELECT id FROM "roles" WHERE name = 'Owner')
        AND "permission_id" IN (
          SELECT id FROM "permissions"
          WHERE key IN ('org:members:read', 'org:members:write', 'org:members:delete')
        );
    `);
  }
}
