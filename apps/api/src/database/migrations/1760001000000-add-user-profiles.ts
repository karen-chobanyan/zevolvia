import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserProfiles1760001000000 implements MigrationInterface {
  name = "AddUserProfiles1760001000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "user_profiles" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
        "first_name" text,
        "last_name" text,
        "phone" text,
        "avatar_url" text,
        "locale" text,
        "time_zone" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "user_profiles";`);
  }
}
