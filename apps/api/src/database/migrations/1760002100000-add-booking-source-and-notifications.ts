import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBookingSourceAndNotifications1760002100000 implements MigrationInterface {
  name = "AddBookingSourceAndNotifications1760002100000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "bookings"
      ADD COLUMN IF NOT EXISTS "source" text NOT NULL DEFAULT 'dashboard';
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "org_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "booking_id" uuid,
        "type" text NOT NULL,
        "title" text NOT NULL,
        "message" text NOT NULL,
        "data" jsonb,
        "read_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_notifications_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_notifications_org_id" FOREIGN KEY ("org_id") REFERENCES "orgs"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_notifications_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_notifications_booking_id" FOREIGN KEY ("booking_id") REFERENCES "bookings"("id") ON DELETE SET NULL
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_notifications_org_user"
      ON "notifications" ("org_id", "user_id");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_notifications_org_created_at"
      ON "notifications" ("org_id", "created_at");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_notifications_org_created_at";');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_notifications_org_user";');
    await queryRunner.query('DROP TABLE IF EXISTS "notifications";');
    await queryRunner.query('ALTER TABLE "bookings" DROP COLUMN IF EXISTS "source";');
  }
}
