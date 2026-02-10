import { MigrationInterface, QueryRunner } from "typeorm";

export class FixSmsMessageClientColumn1760001800000 implements MigrationInterface {
  name = "FixSmsMessageClientColumn1760001800000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "sms_messages"
      ADD COLUMN IF NOT EXISTS "client_id" uuid;
    `);

    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'sms_messages_client_id_fkey'
        ) THEN
          ALTER TABLE "sms_messages"
          ADD CONSTRAINT "sms_messages_client_id_fkey"
          FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL;
        END IF;
      END
      $$;
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "sms_messages_client_idx"
      ON "sms_messages" ("client_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "sms_messages_client_idx";`);
    await queryRunner.query(`
      ALTER TABLE "sms_messages"
      DROP CONSTRAINT IF EXISTS "sms_messages_client_id_fkey";
    `);
    await queryRunner.query(`
      ALTER TABLE "sms_messages"
      DROP COLUMN IF EXISTS "client_id";
    `);
  }
}
