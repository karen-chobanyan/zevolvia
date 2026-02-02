import { MigrationInterface, QueryRunner } from "typeorm";

export class AddChatPermissions1760000700000 implements MigrationInterface {
  name = "AddChatPermissions1760000700000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "permissions" ("key", "description") VALUES
        ('chat:read', 'View chat sessions and messages'),
        ('chat:write', 'Create chat sessions and send messages')
      ON CONFLICT ("key") DO NOTHING;
    `);

    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r.id, p.id
      FROM "roles" r
      CROSS JOIN "permissions" p
      WHERE r.name = 'Owner' AND r.is_system = true
        AND p.key IN ('chat:read', 'chat:write')
      ON CONFLICT DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "role_permissions"
      WHERE "permission_id" IN (
        SELECT id FROM "permissions"
        WHERE key IN ('chat:read', 'chat:write')
      );
    `);

    await queryRunner.query(`
      DELETE FROM "permissions"
      WHERE key IN ('chat:read', 'chat:write');
    `);
  }
}
