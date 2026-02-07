import { MigrationInterface, QueryRunner } from "typeorm";

export class DropStaffAvailability1760001400000 implements MigrationInterface {
  name = "DropStaffAvailability1760001400000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "staff_availability_unique_idx";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "staff_availability_org_user_idx";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "staff_availability";`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
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
  }
}
