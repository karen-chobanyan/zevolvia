import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSmsChatBridge1760001700000 implements MigrationInterface {
  name = "AddSmsChatBridge1760001700000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "chat_sessions"
        ADD COLUMN "source" text NOT NULL DEFAULT 'web',
        ADD COLUMN "external_thread_key" text,
        ADD COLUMN "client_id" uuid REFERENCES "clients"("id") ON DELETE SET NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE "chat_sessions"
        ALTER COLUMN "user_id" DROP NOT NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE "chat_sessions"
        ADD CONSTRAINT "chat_sessions_source_check" CHECK ("source" IN ('web', 'sms'));
    `);

    await queryRunner.query(`
      CREATE INDEX "chat_sessions_org_source_updated_idx"
      ON "chat_sessions" ("org_id", "source", "updated_at");
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "chat_sessions_sms_thread_unique_idx"
      ON "chat_sessions" ("org_id", "source", "external_thread_key")
      WHERE "source" = 'sms' AND "external_thread_key" IS NOT NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX "orgs_phone_idx"
      ON "orgs" ("phone")
      WHERE "phone" IS NOT NULL;
    `);

    await queryRunner.query(`
      CREATE INDEX "clients_org_phone_idx"
      ON "clients" ("org_id", "phone")
      WHERE "phone" IS NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "clients_org_phone_idx";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "orgs_phone_idx";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "chat_sessions_sms_thread_unique_idx";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "chat_sessions_org_source_updated_idx";`);

    await queryRunner.query(`
      ALTER TABLE "chat_sessions"
      DROP CONSTRAINT IF EXISTS "chat_sessions_source_check";
    `);

    await queryRunner.query(`
      DELETE FROM "chat_sessions"
      WHERE "user_id" IS NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE "chat_sessions"
        ALTER COLUMN "user_id" SET NOT NULL;
    `);

    await queryRunner.query(`
      ALTER TABLE "chat_sessions"
        DROP COLUMN IF EXISTS "client_id",
        DROP COLUMN IF EXISTS "external_thread_key",
        DROP COLUMN IF EXISTS "source";
    `);
  }
}
