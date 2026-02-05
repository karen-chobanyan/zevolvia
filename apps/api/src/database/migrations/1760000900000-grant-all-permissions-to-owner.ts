import { MigrationInterface, QueryRunner } from "typeorm";

export class GrantAllPermissionsToOwner1760000900000 implements MigrationInterface {
  name = "GrantAllPermissionsToOwner1760000900000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Grant ALL permissions to 'Owner' role across all organizations
    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r.id, p.id
      FROM "roles" r
      CROSS JOIN "permissions" p
      WHERE r.name = 'Owner'
      ON CONFLICT DO NOTHING;
    `);
  }

  public async down(): Promise<void> {
    // No-op: It's unsafe to indiscriminately remove all permissions from Owner on rollback
    // as we don't track which ones were added specifically by this migration vs existing ones.
  }
}
