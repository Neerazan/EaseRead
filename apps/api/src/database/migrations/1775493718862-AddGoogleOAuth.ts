import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGoogleOAuth1775493718862 implements MigrationInterface {
  name = 'AddGoogleOAuth1775493718862';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user" ADD "googleId" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ADD "avatarUrl" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "passwordHash" DROP NOT NULL`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_470355432cc67b2c470c30bef7" ON "user" ("googleId") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_470355432cc67b2c470c30bef7"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user" ALTER COLUMN "passwordHash" SET NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "avatarUrl"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "googleId"`);
  }
}
