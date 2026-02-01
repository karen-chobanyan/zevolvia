import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFilePermissions1760000400000 implements MigrationInterface {
  name = "AddFilePermissions1760000400000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Insert file permissions
    await queryRunner.query(`
      INSERT INTO "permissions" ("key", "description") VALUES
        ('files:read', 'View files and folders'),
        ('files:write', 'Create and modify files and folders'),
        ('files:upload', 'Upload files'),
        ('files:delete', 'Delete files and folders')
      ON CONFLICT ("key") DO NOTHING;
    `);

    // Grant all file permissions to existing Owner roles
    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r.id, p.id
      FROM "roles" r
      CROSS JOIN "permissions" p
      WHERE r.name = 'Owner' AND r.is_system = true
        AND p.key IN ('files:read', 'files:write', 'files:upload', 'files:delete')
      ON CONFLICT DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove role_permissions for file permissions
    await queryRunner.query(`
      DELETE FROM "role_permissions"
      WHERE "permission_id" IN (
        SELECT id FROM "permissions"
        WHERE key IN ('files:read', 'files:write', 'files:upload', 'files:delete')
      );
    `);

    // Remove file permissions
    await queryRunner.query(`
      DELETE FROM "permissions"
      WHERE key IN ('files:read', 'files:write', 'files:upload', 'files:delete');
    `);
  }
}
