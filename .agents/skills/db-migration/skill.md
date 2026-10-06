---
id: db-migration
name: Database Migration (raw SQL)
description: How to create and run raw SQL migrations with node-pg-migrate in this project
enabled: true
---

This project uses node-pg-migrate with **plain SQL files** (the legacy SQL
loader), not JavaScript/TypeScript builder code.

1. Create a migration:

   ```
   npm run migrate:create <descriptive_name>
   ```

   This scaffolds a timestamped `.sql` file in `migrations/`.

2. Fill in the file with marker sections:

   ```sql
   -- Up Migration
   CREATE TABLE "widgets" (
     "id" bigserial PRIMARY KEY,
     "name" text NOT NULL
   );

   -- Down Migration
   DROP TABLE "widgets";
   ```

   - `-- Up Migration` and `-- Down Migration` markers are required; without
     them the whole file is treated as an up migration with no rollback.
   - Keep the down migration the exact inverse so `migrate:down` works.
   - Quote identifiers, use `snake_case` for columns.

3. Apply it: `npm run migrate:up` (reads `DATABASE_URL` from `.env`).

4. Verify the reverse works when in doubt: `npm run migrate:down` then
   `npm run migrate:up` again.
