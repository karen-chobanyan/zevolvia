import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateEmbeddingsDimension1760000500000 implements MigrationInterface {
  name = "UpdateEmbeddingsDimension1760000500000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "embeddings"
      ALTER COLUMN "vector" TYPE vector(1536);
    `);

    await queryRunner.query(`
      CREATE INDEX "embeddings_vector_idx" ON "embeddings"
      USING ivfflat ("vector" vector_cosine_ops) WITH (lists = 100);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "embeddings_vector_idx";`);

    await queryRunner.query(`
      ALTER TABLE "embeddings"
      ALTER COLUMN "vector" TYPE vector;
    `);
  }
}
