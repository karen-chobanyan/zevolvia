import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNotificationDeliveries1760002300000 implements MigrationInterface {
  name = "AddNotificationDeliveries1760002300000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "notification_deliveries" (
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
      CREATE INDEX IF NOT EXISTS "notification_deliveries_org_status_idx"
      ON "notification_deliveries" ("org_id", "status");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "notification_deliveries_booking_idx"
      ON "notification_deliveries" ("booking_id");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "notification_deliveries_org_created_idx"
      ON "notification_deliveries" ("org_id", "created_at");
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "push_subscriptions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "org_id" uuid NOT NULL REFERENCES "orgs"("id") ON DELETE CASCADE,
        "user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
        "endpoint" text NOT NULL,
        "p256dh" text NOT NULL,
        "auth" text NOT NULL,
        "expiration_time" bigint,
        "user_agent" text,
        CONSTRAINT "PK_push_subscriptions_id" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "push_subscriptions_org_idx"
      ON "push_subscriptions" ("org_id");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "push_subscriptions_org_user_idx"
      ON "push_subscriptions" ("org_id", "user_id");
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "push_subscriptions_org_endpoint_unique_idx"
      ON "push_subscriptions" ("org_id", "endpoint");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "push_subscriptions_org_endpoint_unique_idx";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "push_subscriptions_org_user_idx";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "push_subscriptions_org_idx";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "push_subscriptions";`);

    await queryRunner.query(`DROP INDEX IF EXISTS "notification_deliveries_org_created_idx";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "notification_deliveries_booking_idx";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "notification_deliveries_org_status_idx";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "notification_deliveries";`);
  }
}
