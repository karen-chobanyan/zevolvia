import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNotifications1760002200000 implements MigrationInterface {
  name = "AddNotifications1760002200000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "org_id" uuid NOT NULL REFERENCES "orgs"("id") ON DELETE CASCADE,
        "booking_id" uuid NOT NULL REFERENCES "bookings"("id") ON DELETE CASCADE,
        "channel" text NOT NULL,
        "status" text NOT NULL DEFAULT 'pending',
        "payload" jsonb NOT NULL,
        "attempts" integer NOT NULL DEFAULT 0,
        "error" text,
        "created_at" timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "notifications_org_status_idx"
      ON "notifications" ("org_id", "status");
    `);

    await queryRunner.query(`
      CREATE INDEX "notifications_booking_idx"
      ON "notifications" ("booking_id");
    `);

    await queryRunner.query(`
      CREATE INDEX "notifications_org_created_idx"
      ON "notifications" ("org_id", "created_at");
    `);

    await queryRunner.query(`
      CREATE TABLE "push_subscriptions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "org_id" uuid NOT NULL REFERENCES "orgs"("id") ON DELETE CASCADE,
        "user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
        "endpoint" text NOT NULL,
        "p256dh" text NOT NULL,
        "auth" text NOT NULL,
        "expiration_time" bigint,
        "user_agent" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "push_subscriptions_org_idx"
      ON "push_subscriptions" ("org_id");
    `);

    await queryRunner.query(`
      CREATE INDEX "push_subscriptions_org_user_idx"
      ON "push_subscriptions" ("org_id", "user_id");
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "push_subscriptions_org_endpoint_unique_idx"
      ON "push_subscriptions" ("org_id", "endpoint");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "push_subscriptions_org_endpoint_unique_idx";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "push_subscriptions_org_user_idx";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "push_subscriptions_org_idx";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "push_subscriptions";`);

    await queryRunner.query(`DROP INDEX IF EXISTS "notifications_org_created_idx";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "notifications_booking_idx";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "notifications_org_status_idx";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications";`);
  }
}
