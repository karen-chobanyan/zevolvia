import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPasswordResetTokens1760001600000 implements MigrationInterface {
  name = "AddPasswordResetTokens1760001600000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "password_reset_tokens" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "org_id" uuid NOT NULL REFERENCES "orgs"("id") ON DELETE CASCADE,
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "token_hash" text NOT NULL,
        "expires_at" timestamptz NOT NULL,
        "used_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "password_reset_tokens_hash_idx"
      ON "password_reset_tokens" ("token_hash");
    `);

    await queryRunner.query(`
      CREATE INDEX "password_reset_tokens_org_user_expires_idx"
      ON "password_reset_tokens" ("org_id", "user_id", "expires_at");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "password_reset_tokens_org_user_expires_idx";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "password_reset_tokens_hash_idx";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "password_reset_tokens";`);
  }
}
