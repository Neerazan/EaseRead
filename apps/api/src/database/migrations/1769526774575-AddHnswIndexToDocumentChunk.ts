import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHnswIndexToDocumentChunk1769526774575 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_document_chunk_embedding_hnsw 
            ON document_chunk 
            USING hnsw (embedding vector_cosine_ops) 
            WITH (m = 16, ef_construction = 64);
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_document_chunk_embedding_hnsw;`,
    );
  }
}
