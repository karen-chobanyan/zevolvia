import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrgMessagingSettings1760002500000 implements MigrationInterface {
  name = "AddOrgMessagingSettings1760002500000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "orgs"
        ADD COLUMN IF NOT EXISTS "twilio_account_sid" text,
        ADD COLUMN IF NOT EXISTS "twilio_auth_token" text,
        ADD COLUMN IF NOT EXISTS "twilio_messaging_service_sid" text,
        ADD COLUMN IF NOT EXISTS "telegram_bot_token" text,
        ADD COLUMN IF NOT EXISTS "telegram_bot_username" text,
        ADD COLUMN IF NOT EXISTS "telegram_webhook_secret" text;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "orgs"
        DROP COLUMN IF EXISTS "telegram_webhook_secret",
        DROP COLUMN IF EXISTS "telegram_bot_username",
        DROP COLUMN IF EXISTS "telegram_bot_token",
        DROP COLUMN IF EXISTS "twilio_messaging_service_sid",
        DROP COLUMN IF EXISTS "twilio_auth_token",
        DROP COLUMN IF EXISTS "twilio_account_sid";
    `);
  }
}
