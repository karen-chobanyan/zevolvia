import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNotifications1760002200000 implements MigrationInterface {
  name = "AddNotifications1760002200000";

  public async up(_queryRunner: QueryRunner): Promise<void> {
    // This migration originally tried to create a delivery queue in the
    // "notifications" table name, which already belongs to user-facing
    // notifications from an earlier migration. The queue schema now lives in
    // the later "notification_deliveries" migration.
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Intentionally empty.
  }
}
