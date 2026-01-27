import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBaseTables1769526700000 implements MigrationInterface {
  name = 'CreateBaseTables1769526700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ensure extensions are enabled
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "citext"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "vector"`);

    // Create user_tier_enum type
    await queryRunner.query(
      `CREATE TYPE "public"."user_tier_enum" AS ENUM('FREE', 'PREMIUM')`,
    );

    // Create file_content_format_enum type
    await queryRunner.query(
      `CREATE TYPE "public"."file_content_format_enum" AS ENUM('epub', 'pdf', 'txt')`,
    );

    // Create "user" table
    await queryRunner.query(`
      CREATE TABLE "user" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP WITH TIME ZONE,
        "email" citext NOT NULL,
        "username" citext NOT NULL,
        "name" character varying NOT NULL,
        "passwordHash" character varying NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "lastLoginAt" TIMESTAMP WITH TIME ZONE,
        "tier" "public"."user_tier_enum" NOT NULL DEFAULT 'FREE',
        CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id")
      )
    `);

    // Create unique indexes on user
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_e12875dfb3b1d92d7d7c5377e2" ON "user" ("email")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_78a916df40e02a9deb1c4b75ed" ON "user" ("username")`,
    );

    // Create "file_content" table
    await queryRunner.query(`
      CREATE TABLE "file_content" (
        "hash" character varying(64) NOT NULL,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "fileUrl" text NOT NULL,
        "format" "public"."file_content_format_enum" NOT NULL,
        "fileSize" bigint NOT NULL,
        "isProcessed" boolean NOT NULL DEFAULT false,
        "processedAt" TIMESTAMP WITH TIME ZONE,
        "metadata" jsonb,
        "totalPages" integer,
        "wordsCount" integer,
        CONSTRAINT "PK_5b5e5c8e20307f3c08c8e4d3c0e" PRIMARY KEY ("hash")
      )
    `);

    // Create "document" table
    await queryRunner.query(`
      CREATE TABLE "document" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "userId" uuid NOT NULL,
        "title" character varying(255) NOT NULL,
        "author" character varying(255),
        "coverUrl" text,
        "fileContentHash" character varying(64) NOT NULL,
        CONSTRAINT "UQ_document_user_file" UNIQUE ("userId", "fileContentHash"),
        CONSTRAINT "PK_e57d3357f83f3cdc0acffc3d777" PRIMARY KEY ("id")
      )
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "document" 
      ADD CONSTRAINT "FK_document_user" 
      FOREIGN KEY ("userId") REFERENCES "user"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "document" 
      ADD CONSTRAINT "FK_document_file_content" 
      FOREIGN KEY ("fileContentHash") REFERENCES "file_content"("hash") 
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    await queryRunner.query(
      `ALTER TABLE "document" DROP CONSTRAINT "FK_document_file_content"`,
    );
    await queryRunner.query(
      `ALTER TABLE "document" DROP CONSTRAINT "FK_document_user"`,
    );

    // Drop tables
    await queryRunner.query(`DROP TABLE "document"`);
    await queryRunner.query(`DROP TABLE "file_content"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_78a916df40e02a9deb1c4b75ed"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_e12875dfb3b1d92d7d7c5377e2"`,
    );
    await queryRunner.query(`DROP TABLE "user"`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE "public"."file_content_format_enum"`);
    await queryRunner.query(`DROP TYPE "public"."user_tier_enum"`);
  }
}
