# Database Migrations Guide

This guide explains how to manage database schema changes using TypeORM migrations.

---

## Quick Reference

| Command | Description |
|---------|-------------|
| `yarn db:migrate:generate <path>` | Generate migration from entity changes |
| `yarn db:migrate:run` | Run all pending migrations |
| `yarn db:migrate:revert` | Revert the last migration |
| `yarn db:migrate:create <path>` | Create a blank migration |
| `yarn db:migrate:show` | Show migration status |

---

## 1. Generating Migrations (From Entity Changes)

When you modify an entity (add/remove columns, change types), generate a migration:

```bash
yarn db:migrate:generate src/database/migrations/AddDescriptionToDocument
```

This compares your entities to the database and generates SQL.

> **Tip**: Always review the generated migration before running it!

---

## 2. Running Migrations

Apply all pending migrations:

```bash
yarn db:migrate:run
```

Migrations run automatically on app startup (`migrationsRun: true`), but you can also run them manually.

---

## 3. Reverting Migrations

Undo the last migration:

```bash
yarn db:migrate:revert
```

To revert multiple migrations, run the command multiple times.

---

## 4. Creating Blank Migrations (Custom SQL)

For custom SQL (indexes, triggers, raw queries):

```bash
yarn db:migrate:create src/database/migrations/AddCustomIndex
```

Then edit the generated file:

```typescript
export class AddCustomIndex1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE INDEX ...`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX ...`);
  }
}
```

---

## 5. Checking Migration Status

See which migrations have been applied:

```bash
yarn db:migrate:show
```

---

## Workflow Example

```bash
# 1. Modify your entity
# (e.g., add a new column to Document)

# 2. Generate migration
yarn db:migrate:generate src/database/migrations/AddSummaryToDocument

# 3. Review the generated file
# (check the SQL is correct)

# 4. Run the migration
yarn db:migrate:run

# 5. If something went wrong, revert
yarn db:migrate:revert
```

---

## Best Practices

1. **Always review generated migrations** before running
2. **Use descriptive names**: `AddUserRoleColumn`, not `Update1`
3. **Test `down()` method**: Ensure migrations can be reverted
4. **Commit migrations** to version control
5. **Never edit applied migrations**: Create a new one instead
