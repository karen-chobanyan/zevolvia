import { MigrationInterface, QueryRunner } from "typeorm";

export class AssignBookingPermissions1760001000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Get permission IDs
    const permissions = await queryRunner.query(`
      SELECT id, key FROM permissions
      WHERE key IN (
        'services:read', 'services:write', 'services:delete',
        'clients:read', 'clients:write', 'clients:delete',
        'bookings:read', 'bookings:write', 'bookings:delete',
        'staff-availability:read', 'staff-availability:write'
      )
    `);

    // Get all roles
    const roles = await queryRunner.query(`
      SELECT id, name FROM roles WHERE name IN ('Owner', 'Admin', 'Member')
    `);

    for (const role of roles) {
      for (const perm of permissions) {
        // Owner/Admin get all permissions
        // Member gets only read permissions
        const isReadOnly = perm.key.endsWith(":read");
        const isMember = role.name === "Member";

        if (!isMember || isReadOnly) {
          await queryRunner.query(
            `
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
          `,
            [role.id, perm.id],
          );
        }
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM role_permissions
      WHERE "permissionId" IN (
        SELECT id FROM permissions WHERE key LIKE 'services:%'
        OR key LIKE 'clients:%' OR key LIKE 'bookings:%'
        OR key LIKE 'staff-availability:%'
      )
    `);
  }
}
