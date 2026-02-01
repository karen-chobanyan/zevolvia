import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFiles1760000200000 implements MigrationInterface {
  name = "AddFiles1760000200000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "files" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "org_id" uuid NOT NULL REFERENCES "orgs"("id") ON DELETE CASCADE,
        "knowledge_base_id" uuid REFERENCES "knowledge_bases"("id") ON DELETE SET NULL,
        "uploaded_by_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
        "bucket" text NOT NULL,
        "storage_key" text NOT NULL,
        "original_name" text NOT NULL,
        "mime_type" text NOT NULL,
        "size" bigint NOT NULL,
        "checksum" text,
        "status" text NOT NULL DEFAULT 'uploaded',
        "rag_status" text NOT NULL DEFAULT 'pending',
        "error_message" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`CREATE INDEX "files_org_status_idx" ON "files" ("org_id", "status");`);
    await queryRunner.query(
      `CREATE INDEX "files_org_kb_idx" ON "files" ("org_id", "knowledge_base_id");`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "files_storage_key_idx" ON "files" ("storage_key");`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "files_storage_key_idx";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "files_org_kb_idx";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "files_org_status_idx";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "files";`);
  }
}
