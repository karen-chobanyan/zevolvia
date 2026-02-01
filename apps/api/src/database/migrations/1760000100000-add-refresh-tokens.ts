import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRefreshTokens1760000100000 implements MigrationInterface {
  name = "AddRefreshTokens1760000100000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "org_id" uuid NOT NULL REFERENCES "orgs"("id") ON DELETE CASCADE,
        "token_hash" text NOT NULL,
        "expires_at" timestamptz NOT NULL,
        "revoked_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX "refresh_tokens_hash_idx" ON "refresh_tokens" ("token_hash");`,
    );
    await queryRunner.query(
      `CREATE INDEX "refresh_tokens_user_org_idx" ON "refresh_tokens" ("user_id", "org_id");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "refresh_tokens_user_org_idx";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "refresh_tokens_hash_idx";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "refresh_tokens";`);
  }
}
