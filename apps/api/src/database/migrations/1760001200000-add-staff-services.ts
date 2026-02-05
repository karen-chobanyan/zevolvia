import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStaffServices1760001200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create staff_services join table
    await queryRunner.query(`
      CREATE TABLE "staff_services" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "service_id" uuid NOT NULL REFERENCES "services"("id") ON DELETE CASCADE,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        UNIQUE ("user_id", "service_id")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "staff_services_user_id_idx" ON "staff_services" ("user_id");
    `);

    await queryRunner.query(`
      CREATE INDEX "staff_services_service_id_idx" ON "staff_services" ("service_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "staff_services_service_id_idx";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "staff_services_user_id_idx";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "staff_services";`);
  }
}
