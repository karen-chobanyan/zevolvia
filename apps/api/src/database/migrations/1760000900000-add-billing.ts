import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBilling1760000900000 implements MigrationInterface {
  name = "AddBilling1760000900000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "billing_customers" (
        "org_id" uuid PRIMARY KEY REFERENCES "orgs"("id") ON DELETE CASCADE,
        "provider" text NOT NULL DEFAULT 'stripe',
        "customer_id" text NOT NULL UNIQUE
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "billing_subscriptions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "org_id" uuid NOT NULL UNIQUE REFERENCES "orgs"("id") ON DELETE CASCADE,
        "provider" text NOT NULL DEFAULT 'stripe',
        "customer_id" text,
        "subscription_id" text UNIQUE,
        "subscription_item_id" text,
        "status" text NOT NULL DEFAULT 'trialing',
        "price_id" text,
        "quantity" integer NOT NULL DEFAULT 1,
        "current_period_start" timestamptz,
        "current_period_end" timestamptz,
        "trial_start" timestamptz,
        "trial_end" timestamptz,
        "trial_converted_at" timestamptz,
        "canceled_at" timestamptz,
        "ended_at" timestamptz,
        "cancel_at_period_end" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX "billing_subscriptions_customer_idx" ON "billing_subscriptions" ("customer_id");
    `);

    await queryRunner.query(`
      CREATE INDEX "billing_subscriptions_subscription_idx" ON "billing_subscriptions" ("subscription_id");
    `);

    await queryRunner.query(`
      CREATE INDEX "billing_subscriptions_status_trial_idx" ON "billing_subscriptions" ("status", "trial_end");
    `);

    await queryRunner.query(`
      INSERT INTO "permissions" ("key", "description") VALUES
        ('billing:read', 'View billing status'),
        ('billing:write', 'Manage billing')
      ON CONFLICT ("key") DO NOTHING;
    `);

    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r.id, p.id
      FROM "roles" r
      CROSS JOIN "permissions" p
      WHERE r.name IN ('Owner', 'Admin')
        AND p.key IN ('billing:read', 'billing:write')
      ON CONFLICT DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "role_permissions"
      WHERE "permission_id" IN (
        SELECT id FROM "permissions"
        WHERE key IN ('billing:read', 'billing:write')
      );
    `);

    await queryRunner.query(`
      DELETE FROM "permissions"
      WHERE key IN ('billing:read', 'billing:write');
    `);

    await queryRunner.query(`DROP INDEX IF EXISTS "billing_subscriptions_status_trial_idx";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "billing_subscriptions_subscription_idx";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "billing_subscriptions_customer_idx";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "billing_subscriptions";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "billing_customers";`);
  }
}
