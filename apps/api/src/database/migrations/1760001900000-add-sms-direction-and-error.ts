import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSmsDirectionAndError1760001900000 implements MigrationInterface {
  name = "AddSmsDirectionAndError1760001900000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "sms_messages"
        ADD COLUMN IF NOT EXISTS "direction" text NOT NULL DEFAULT 'inbound',
        ADD COLUMN IF NOT EXISTS "response_to_message_sid" text,
        ADD COLUMN IF NOT EXISTS "error_message" text;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'sms_messages_direction_check'
        ) THEN
          ALTER TABLE "sms_messages"
            ADD CONSTRAINT "sms_messages_direction_check"
            CHECK ("direction" IN ('inbound', 'outbound'));
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "sms_messages_org_direction_created_idx"
      ON "sms_messages" ("org_id", "direction", "created_at");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "sms_messages_org_direction_created_idx";`);
    await queryRunner.query(`
      ALTER TABLE "sms_messages"
      DROP CONSTRAINT IF EXISTS "sms_messages_direction_check";
    `);
    await queryRunner.query(`
      ALTER TABLE "sms_messages"
        DROP COLUMN IF EXISTS "error_message",
        DROP COLUMN IF EXISTS "response_to_message_sid",
        DROP COLUMN IF EXISTS "direction";
    `);
  }
}
