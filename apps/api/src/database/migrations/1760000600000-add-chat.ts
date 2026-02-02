import { MigrationInterface, QueryRunner } from "typeorm";

export class AddChat1760000600000 implements MigrationInterface {
  name = "AddChat1760000600000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "chat_sessions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "org_id" uuid NOT NULL REFERENCES "orgs"("id") ON DELETE CASCADE,
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "title" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "chat_sessions_org_user_updated_idx"
      ON "chat_sessions" ("org_id", "user_id", "updated_at");
    `);

    await queryRunner.query(`
      CREATE TABLE "chat_messages" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "session_id" uuid NOT NULL REFERENCES "chat_sessions"("id") ON DELETE CASCADE,
        "role" text NOT NULL,
        "content" text NOT NULL,
        "metadata" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "chat_messages_session_created_idx"
      ON "chat_messages" ("session_id", "created_at");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "chat_messages_session_created_idx";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "chat_messages";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "chat_sessions_org_user_updated_idx";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "chat_sessions";`);
  }
}
