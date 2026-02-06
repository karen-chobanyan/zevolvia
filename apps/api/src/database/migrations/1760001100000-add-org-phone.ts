import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrgPhone1760001100000 implements MigrationInterface {
  name = "AddOrgPhone1760001100000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "orgs" ADD COLUMN "phone" text;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "orgs" DROP COLUMN IF EXISTS "phone";
    `);
  }
}
