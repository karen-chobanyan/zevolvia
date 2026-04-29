import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMessagingChannels1760002400000 implements MigrationInterface {
  name = "AddMessagingChannels1760002400000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "sms_messages"
        ADD COLUMN IF NOT EXISTS "channel" text NOT NULL DEFAULT 'sms';
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'sms_messages_channel_check'
        ) THEN
          ALTER TABLE "sms_messages"
            ADD CONSTRAINT "sms_messages_channel_check"
            CHECK ("channel" IN ('sms', 'whatsapp', 'telegram'));
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "sms_messages_org_channel_created_idx"
      ON "sms_messages" ("org_id", "channel", "created_at");
    `);

    await queryRunner.query(`
      ALTER TABLE "chat_sessions"
      DROP CONSTRAINT IF EXISTS "chat_sessions_source_check";
    `);

    await queryRunner.query(`
      ALTER TABLE "chat_sessions"
        ADD CONSTRAINT "chat_sessions_source_check"
        CHECK ("source" IN ('web', 'sms', 'whatsapp', 'telegram'));
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "chat_sessions_sms_thread_unique_idx";
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "chat_sessions_messaging_thread_unique_idx"
      ON "chat_sessions" ("org_id", "source", "external_thread_key")
      WHERE "source" IN ('sms', 'whatsapp', 'telegram') AND "external_thread_key" IS NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "chat_sessions_messaging_thread_unique_idx";`);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "chat_sessions_sms_thread_unique_idx"
      ON "chat_sessions" ("org_id", "source", "external_thread_key")
      WHERE "source" = 'sms' AND "external_thread_key" IS NOT NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE "chat_sessions"
      DROP CONSTRAINT IF EXISTS "chat_sessions_source_check";
    `);

    await queryRunner.query(`
      ALTER TABLE "chat_sessions"
        ADD CONSTRAINT "chat_sessions_source_check"
        CHECK ("source" IN ('web', 'sms'));
    `);

    await queryRunner.query(`DROP INDEX IF EXISTS "sms_messages_org_channel_created_idx";`);
    await queryRunner.query(`
      ALTER TABLE "sms_messages"
      DROP CONSTRAINT IF EXISTS "sms_messages_channel_check";
    `);
    await queryRunner.query(`
      ALTER TABLE "sms_messages"
        DROP COLUMN IF EXISTS "channel";
    `);
  }
}
