import { MigrationInterface, QueryRunner } from "typeorm";

export class InitCore1760000000000 implements MigrationInterface {
  name = "InitCore1760000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "vector";`);

    await queryRunner.query(`
      CREATE TABLE "orgs" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" text NOT NULL,
        "slug" text NOT NULL UNIQUE,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" text NOT NULL UNIQUE,
        "name" text,
        "password_hash" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "roles" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "org_id" uuid NOT NULL REFERENCES "orgs"("id") ON DELETE CASCADE,
        "name" text NOT NULL,
        "description" text,
        "is_system" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "roles_org_name_idx" ON "roles" ("org_id", "name");`
    );

    await queryRunner.query(`
      CREATE TABLE "permissions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "key" text NOT NULL UNIQUE,
        "description" text,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "role_permissions" (
        "role_id" uuid NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
        "permission_id" uuid NOT NULL REFERENCES "permissions"("id") ON DELETE CASCADE,
        PRIMARY KEY ("role_id", "permission_id")
      );
    `);

    await queryRunner.query(`
      CREATE TABLE "memberships" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "org_id" uuid NOT NULL REFERENCES "orgs"("id") ON DELETE CASCADE,
        "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "role_id" uuid NOT NULL REFERENCES "roles"("id") ON DELETE RESTRICT,
        "status" text NOT NULL DEFAULT 'active',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "memberships_org_user_idx" ON "memberships" ("org_id", "user_id");`
    );

    await queryRunner.query(`
      CREATE TABLE "knowledge_bases" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "org_id" uuid NOT NULL REFERENCES "orgs"("id") ON DELETE CASCADE,
        "name" text NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "knowledge_bases_org_name_idx" ON "knowledge_bases" ("org_id", "name");`
    );

    await queryRunner.query(`
      CREATE TABLE "documents" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "org_id" uuid NOT NULL REFERENCES "orgs"("id") ON DELETE CASCADE,
        "knowledge_base_id" uuid NOT NULL REFERENCES "knowledge_bases"("id") ON DELETE CASCADE,
        "name" text NOT NULL,
        "source_type" text NOT NULL,
        "source_uri" text,
        "status" text NOT NULL DEFAULT 'pending',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(
      `CREATE INDEX "documents_org_kb_idx" ON "documents" ("org_id", "knowledge_base_id");`
    );

    await queryRunner.query(`
      CREATE TABLE "chunks" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "org_id" uuid NOT NULL REFERENCES "orgs"("id") ON DELETE CASCADE,
        "document_id" uuid NOT NULL REFERENCES "documents"("id") ON DELETE CASCADE,
        "idx" integer NOT NULL,
        "content" text NOT NULL,
        "tokens" integer,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now()
      );
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "chunks_document_idx" ON "chunks" ("document_id", "idx");`
    );
    await queryRunner.query(`CREATE INDEX "chunks_org_idx" ON "chunks" ("org_id");`);

    await queryRunner.query(`
      CREATE TABLE "embeddings" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "org_id" uuid NOT NULL REFERENCES "orgs"("id") ON DELETE CASCADE,
        "chunk_id" uuid NOT NULL REFERENCES "chunks"("id") ON DELETE CASCADE,
        "vector" vector NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        UNIQUE ("chunk_id")
      );
    `);
    await queryRunner.query(
      `CREATE INDEX "embeddings_org_idx" ON "embeddings" ("org_id");`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "embeddings_org_idx";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "embeddings";`);

    await queryRunner.query(`DROP INDEX IF EXISTS "chunks_org_idx";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "chunks_document_idx";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "chunks";`);

    await queryRunner.query(`DROP INDEX IF EXISTS "documents_org_kb_idx";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "documents";`);

    await queryRunner.query(`DROP INDEX IF EXISTS "knowledge_bases_org_name_idx";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "knowledge_bases";`);

    await queryRunner.query(`DROP INDEX IF EXISTS "memberships_org_user_idx";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "memberships";`);

    await queryRunner.query(`DROP TABLE IF EXISTS "role_permissions";`);

    await queryRunner.query(`DROP TABLE IF EXISTS "permissions";`);

    await queryRunner.query(`DROP INDEX IF EXISTS "roles_org_name_idx";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "roles";`);

    await queryRunner.query(`DROP TABLE IF EXISTS "users";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "orgs";`);

    await queryRunner.query(`DROP EXTENSION IF EXISTS "vector";`);
    await queryRunner.query(`DROP EXTENSION IF EXISTS "pgcrypto";`);
  }
}
