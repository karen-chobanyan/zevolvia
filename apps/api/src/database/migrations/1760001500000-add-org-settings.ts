import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrgSettings1760001500000 implements MigrationInterface {
  name = "AddOrgSettings1760001500000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "orgs"
        ADD COLUMN "time_zone" text,
        ADD COLUMN "working_hours_start" time NOT NULL DEFAULT '09:00',
        ADD COLUMN "working_hours_end" time NOT NULL DEFAULT '20:00';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "orgs"
        DROP COLUMN IF EXISTS "working_hours_end",
        DROP COLUMN IF EXISTS "working_hours_start",
        DROP COLUMN IF EXISTS "time_zone";
    `);
  }
}
