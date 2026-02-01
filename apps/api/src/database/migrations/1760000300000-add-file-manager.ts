import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFileManager1760000300000 implements MigrationInterface {
  name = "AddFileManager1760000300000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create folders table
    await queryRunner.query(`
      CREATE TABLE "folders" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "org_id" uuid NOT NULL REFERENCES "orgs"("id") ON DELETE CASCADE,
        "parent_id" uuid REFERENCES "folders"("id") ON DELETE CASCADE,
        "name" text NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(
      `CREATE INDEX "folders_org_parent_idx" ON "folders" ("org_id", "parent_id");`,
    );

    // Add folder_id column to files table
    await queryRunner.query(`
      ALTER TABLE "files" ADD COLUMN "folder_id" uuid REFERENCES "folders"("id") ON DELETE SET NULL;
    `);

    await queryRunner.query(`CREATE INDEX "files_folder_idx" ON "files" ("folder_id");`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "files_folder_idx";`);
    await queryRunner.query(`ALTER TABLE "files" DROP COLUMN IF EXISTS "folder_id";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "folders_org_parent_idx";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "folders";`);
  }
}
