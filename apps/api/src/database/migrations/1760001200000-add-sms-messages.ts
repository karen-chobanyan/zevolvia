import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSmsMessages1760001200000 implements MigrationInterface {
  name = "AddSmsMessages1760001200000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "sms_messages" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "org_id" uuid NOT NULL REFERENCES "orgs"("id") ON DELETE CASCADE,
        "from_number" text NOT NULL,
        "to_number" text NOT NULL,
        "client_id" uuid REFERENCES "clients"("id") ON DELETE SET NULL,
        "body" text NOT NULL,
        "message_sid" text NOT NULL UNIQUE,
        "account_sid" text NOT NULL,
        "messaging_service_sid" text,
        "sms_status" text,
        "num_media" integer NOT NULL DEFAULT 0,
        "media" jsonb,
        "raw_payload" jsonb NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "sms_messages_org_created_idx" ON "sms_messages" ("org_id", "created_at");
    `);

    await queryRunner.query(`
      CREATE INDEX "sms_messages_client_idx" ON "sms_messages" ("client_id");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "sms_messages_client_idx";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "sms_messages_org_created_idx";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sms_messages";`);
  }
}
