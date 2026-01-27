import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1769526742210 implements MigrationInterface {
  name = 'InitialSchema1769526742210';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ensure extensions are enabled
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "citext"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "vector"`);

    await queryRunner.query(
      `CREATE TABLE "document_chunk" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "content" text NOT NULL, "embedding" vector(1536), "tokenCount" integer, "chapterTitle" character varying, "pageNumber" integer, "startOffset" integer, "endOffset" integer, "index" integer NOT NULL, "documentId" uuid NOT NULL, CONSTRAINT "PK_70d9772bf367d82f9b7e568c87c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_chunk" ADD CONSTRAINT "FK_3e9a852328831b703e5ef175ca8" FOREIGN KEY ("documentId") REFERENCES "document"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "document_chunk" DROP CONSTRAINT "FK_3e9a852328831b703e5ef175ca8"`,
    );
    await queryRunner.query(`DROP TABLE "document_chunk"`);
  }
}
