import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSmsRetentionSettings1760002000000 implements MigrationInterface {
  name = "AddSmsRetentionSettings1760002000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "sms_retention_settings" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "org_id" uuid NOT NULL,
        "is_enabled" boolean NOT NULL DEFAULT true,
        "we_miss_you_enabled" boolean NOT NULL DEFAULT true,
        "next_booking_special_enabled" boolean NOT NULL DEFAULT true,
        "churn_days" integer NOT NULL DEFAULT 30,
        "last_run_at" TIMESTAMP WITH TIME ZONE,
        CONSTRAINT "PK_sms_retention_settings_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_sms_retention_settings_org_id" UNIQUE ("org_id"),
        CONSTRAINT "FK_sms_retention_settings_org_id" FOREIGN KEY ("org_id") REFERENCES "orgs"("id") ON DELETE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_sms_retention_settings_org_id"
      ON "sms_retention_settings" ("org_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_sms_retention_settings_org_id";');
    await queryRunner.query('DROP TABLE IF EXISTS "sms_retention_settings";');
  }
}
