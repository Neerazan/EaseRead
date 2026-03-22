import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialDatabaseStructure1773752838560 implements MigrationInterface {
  name = 'InitialDatabaseStructure1773752838560';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "document_chunk" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "content" text NOT NULL, "embedding" vector(3072), "tokenCount" integer, "chapterTitle" character varying, "headingPath" jsonb, "semanticSummary" text, "pageNumber" integer, "startOffset" integer, "endOffset" integer, "index" integer NOT NULL, "contentTypes" jsonb, "metadata" jsonb, "isImportant" boolean NOT NULL DEFAULT false, "fileContentHash" character varying(64) NOT NULL, CONSTRAINT "PK_70d9772bf367d82f9b7e568c87c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."file_content_format_enum" AS ENUM('epub', 'pdf', 'txt')`,
    );
    await queryRunner.query(
      `CREATE TABLE "file_content" ("hash" character varying(64) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "fileUrl" text NOT NULL, "format" "public"."file_content_format_enum" NOT NULL, "fileSize" bigint NOT NULL, "isProcessed" boolean NOT NULL DEFAULT false, "processedAt" TIMESTAMP WITH TIME ZONE, "metadata" jsonb, "totalPages" integer, "wordsCount" integer, CONSTRAINT "PK_246414b36c4430152211f90071b" PRIMARY KEY ("hash"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "document" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "userId" uuid NOT NULL, "title" character varying(255) NOT NULL, "author" character varying(255), "coverUrl" text, "fileContentHash" character varying(64) NOT NULL, CONSTRAINT "UQ_9e9c8454bc6c54e4884a6608242" UNIQUE ("userId", "fileContentHash"), CONSTRAINT "PK_e57d3357f83f3cdc0acffc3d777" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."user_tier_enum" AS ENUM('FREE', 'PREMIUM')`,
    );
    await queryRunner.query(
      `CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, "email" citext NOT NULL, "username" citext NOT NULL, "name" character varying NOT NULL, "passwordHash" character varying NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "lastLoginAt" TIMESTAMP WITH TIME ZONE, "tier" "public"."user_tier_enum" NOT NULL DEFAULT 'FREE', CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_e12875dfb3b1d92d7d7c5377e2" ON "user" ("email") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_78a916df40e02a9deb1c4b75ed" ON "user" ("username") `,
    );
    await queryRunner.query(
      `ALTER TABLE "document_chunk" ADD CONSTRAINT "FK_c141776587087cbf4953e8f0f0d" FOREIGN KEY ("fileContentHash") REFERENCES "file_content"("hash") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "document" ADD CONSTRAINT "FK_7424ddcbdf1e9b067669eb0d3fd" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "document" ADD CONSTRAINT "FK_b9ddd1a75adb6989f6325afde75" FOREIGN KEY ("fileContentHash") REFERENCES "file_content"("hash") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "document" DROP CONSTRAINT "FK_b9ddd1a75adb6989f6325afde75"`,
    );
    await queryRunner.query(
      `ALTER TABLE "document" DROP CONSTRAINT "FK_7424ddcbdf1e9b067669eb0d3fd"`,
    );
    await queryRunner.query(
      `ALTER TABLE "document_chunk" DROP CONSTRAINT "FK_c141776587087cbf4953e8f0f0d"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_78a916df40e02a9deb1c4b75ed"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e12875dfb3b1d92d7d7c5377e2"`,
    );
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`DROP TYPE "public"."user_tier_enum"`);
    await queryRunner.query(`DROP TABLE "document"`);
    await queryRunner.query(`DROP TABLE "file_content"`);
    await queryRunner.query(`DROP TYPE "public"."file_content_format_enum"`);
    await queryRunner.query(`DROP TABLE "document_chunk"`);
  }
}
