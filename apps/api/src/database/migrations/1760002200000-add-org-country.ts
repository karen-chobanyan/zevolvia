import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrgCountry1760002200000 implements MigrationInterface {
  name = "AddOrgCountry1760002200000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "orgs"
      ADD COLUMN "country" text NOT NULL DEFAULT 'US';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "orgs" DROP COLUMN IF EXISTS "country";
    `);
  }
}
