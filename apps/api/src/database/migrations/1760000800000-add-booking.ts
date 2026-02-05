import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBooking1760000800000 implements MigrationInterface {
  name = "AddBooking1760000800000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create services table
    await queryRunner.query(`
      CREATE TABLE "services" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "org_id" uuid NOT NULL REFERENCES "orgs"("id") ON DELETE CASCADE,
        "name" text NOT NULL,
        "description" text,
        "duration_minutes" integer NOT NULL DEFAULT 30,
        "price" decimal(10, 2) NOT NULL DEFAULT 0,
        "color" text DEFAULT '#3b82f6',
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "services_org_id_idx" ON "services" ("org_id");
    `);

    await queryRunner.query(`
      CREATE INDEX "services_org_active_idx" ON "services" ("org_id", "is_active");
    `);

    // Create clients table
    await queryRunner.query(`
      CREATE TABLE "clients" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "org_id" uuid NOT NULL REFERENCES "orgs"("id") ON DELETE CASCADE,
        "name" text NOT NULL,
        "email" text,
        "phone" text,
        "notes" text,
        "is_walk_in" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "clients_org_id_idx" ON "clients" ("org_id");
    `);

    await queryRunner.query(`
      CREATE INDEX "clients_org_email_idx" ON "clients" ("org_id", "email");
    `);

    await queryRunner.query(`
      CREATE INDEX "clients_org_name_idx" ON "clients" ("org_id", "name");
    `);

    // Create staff_availability table
    await queryRunner.query(`
      CREATE TABLE "staff_availability" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "org_id" uuid NOT NULL REFERENCES "orgs"("id") ON DELETE CASCADE,
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "day_of_week" integer NOT NULL,
        "start_time" time NOT NULL,
        "end_time" time NOT NULL,
        "is_available" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "staff_availability_day_check" CHECK ("day_of_week" >= 0 AND "day_of_week" <= 6)
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "staff_availability_org_user_idx" ON "staff_availability" ("org_id", "user_id");
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "staff_availability_unique_idx" ON "staff_availability" ("org_id", "user_id", "day_of_week");
    `);

    // Create bookings table
    await queryRunner.query(`
      CREATE TABLE "bookings" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "org_id" uuid NOT NULL REFERENCES "orgs"("id") ON DELETE CASCADE,
        "client_id" uuid REFERENCES "clients"("id") ON DELETE SET NULL,
        "staff_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "service_id" uuid NOT NULL REFERENCES "services"("id") ON DELETE CASCADE,
        "start_time" timestamptz NOT NULL,
        "end_time" timestamptz NOT NULL,
        "status" text NOT NULL DEFAULT 'scheduled',
        "notes" text,
        "client_name" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "bookings_org_id_idx" ON "bookings" ("org_id");
    `);

    await queryRunner.query(`
      CREATE INDEX "bookings_staff_start_idx" ON "bookings" ("staff_id", "start_time");
    `);

    await queryRunner.query(`
      CREATE INDEX "bookings_org_status_idx" ON "bookings" ("org_id", "status");
    `);

    await queryRunner.query(`
      CREATE INDEX "bookings_org_date_idx" ON "bookings" ("org_id", "start_time", "end_time");
    `);

    // Add new permissions
    await queryRunner.query(`
      INSERT INTO "permissions" ("key", "description") VALUES
        ('services:read', 'View services'),
        ('services:write', 'Create and update services'),
        ('services:delete', 'Delete services'),
        ('clients:read', 'View clients'),
        ('clients:write', 'Create and update clients'),
        ('clients:delete', 'Delete clients'),
        ('bookings:read', 'View bookings'),
        ('bookings:write', 'Create and update bookings'),
        ('bookings:delete', 'Delete bookings'),
        ('staff-availability:read', 'View staff availability'),
        ('staff-availability:write', 'Manage staff availability')
      ON CONFLICT ("key") DO NOTHING;
    `);

    // Grant booking permissions to default roles
    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r.id, p.id
      FROM "roles" r
      CROSS JOIN "permissions" p
      WHERE r.name = 'Admin'
        AND p.key IN (
          'services:read', 'services:write', 'services:delete',
          'clients:read', 'clients:write', 'clients:delete',
          'bookings:read', 'bookings:write', 'bookings:delete',
          'staff-availability:read', 'staff-availability:write'
        )
      ON CONFLICT DO NOTHING;
    `);

    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r.id, p.id
      FROM "roles" r
      CROSS JOIN "permissions" p
      WHERE r.name = 'Member'
        AND p.key IN (
          'services:read',
          'clients:read', 'clients:write',
          'bookings:read', 'bookings:write',
          'staff-availability:read'
        )
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
          'services:read', 'services:write', 'services:delete',
          'clients:read', 'clients:write', 'clients:delete',
          'bookings:read', 'bookings:write', 'bookings:delete',
          'staff-availability:read', 'staff-availability:write'
        )
      );
    `);

    // Remove permissions
    await queryRunner.query(`
      DELETE FROM "permissions"
      WHERE key IN (
        'services:read', 'services:write', 'services:delete',
        'clients:read', 'clients:write', 'clients:delete',
        'bookings:read', 'bookings:write', 'bookings:delete',
        'staff-availability:read', 'staff-availability:write'
      );
    `);

    // Drop tables
    await queryRunner.query(`DROP INDEX IF EXISTS "bookings_org_date_idx";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "bookings_org_status_idx";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "bookings_staff_start_idx";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "bookings_org_id_idx";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "bookings";`);

    await queryRunner.query(`DROP INDEX IF EXISTS "staff_availability_unique_idx";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "staff_availability_org_user_idx";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "staff_availability";`);

    await queryRunner.query(`DROP INDEX IF EXISTS "clients_org_name_idx";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "clients_org_email_idx";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "clients_org_id_idx";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "clients";`);

    await queryRunner.query(`DROP INDEX IF EXISTS "services_org_active_idx";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "services_org_id_idx";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "services";`);
  }
}
