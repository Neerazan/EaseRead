import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWaEntities1774183518306 implements MigrationInterface {
  name = 'AddWaEntities1774183518306';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "chat_message" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "documentId" uuid NOT NULL, "userId" uuid NOT NULL, "role" character varying(16) NOT NULL, "content" text NOT NULL, CONSTRAINT "PK_3cc0d85193aade457d3077dd06b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_3743ee68bfc20802638037b2dc" ON "chat_message" ("documentId", "userId") `,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."document_documenttype_enum" AS ENUM('NOVEL', 'SHORT_STORY', 'NOVELLA', 'GRAPHIC_NOVEL', 'POETRY_COLLECTION', 'ANTHOLOGY', 'SELF_HELP', 'BIOGRAPHY', 'AUTOBIOGRAPHY', 'MEMOIR', 'ESSAY', 'ENCYCLOPEDIA', 'RESEARCH_PAPER', 'TEXTBOOK', 'THESIS', 'DISSERTATION', 'JOURNAL', 'MONOGRAPH', 'OTHER')`,
    );
    await queryRunner.query(
      `ALTER TABLE "document" ADD "documentType" "public"."document_documenttype_enum" NOT NULL DEFAULT 'NOVEL'`,
    );
    await queryRunner.query(
      `ALTER TABLE "document" ADD "preventSpoilers" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_message" ADD CONSTRAINT "FK_360723bffb487b085cdcda2cf4d" FOREIGN KEY ("documentId") REFERENCES "document"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_message" ADD CONSTRAINT "FK_a44ec486210e6f8b4591776d6f3" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "chat_message" DROP CONSTRAINT "FK_a44ec486210e6f8b4591776d6f3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "chat_message" DROP CONSTRAINT "FK_360723bffb487b085cdcda2cf4d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "document" DROP COLUMN "preventSpoilers"`,
    );
    await queryRunner.query(
      `ALTER TABLE "document" DROP COLUMN "documentType"`,
    );
    await queryRunner.query(`DROP TYPE "public"."document_documenttype_enum"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_3743ee68bfc20802638037b2dc"`,
    );
    await queryRunner.query(`DROP TABLE "chat_message"`);
  }
}
