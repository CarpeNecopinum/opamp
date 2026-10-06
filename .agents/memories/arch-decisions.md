---
id: arch_001
title: Project stack decisions
content: SvelteKit 3 + Slonik (zod-validated raw SQL) + node-pg-migrate with raw SQL files
importance: high
tags: database, orm, migrations, stack, sveltekit
---

We chose PostgreSQL with Slonik (not an ORM like Drizzle) because Slonik
promotes raw SQL, protects against unsafe value interpolation, and validates
query results at runtime with zod via `sql.type`.

Migrations use node-pg-migrate in its less-documented raw-SQL-file mode:
plain `.sql` files with `-- Up Migration` / `-- Down Migration` marker
comments, scaffolded with `migrate:create -j sql`. This keeps schema changes
reviewable as SQL diffs and avoids the pgm builder API entirely.

The postgres URL is configurable through the `DATABASE_URL` env var, declared
in `src/env.ts` with a zod schema and a default of
`postgres://postgres@localhost:5432/opamp` (dev DB on localhost, user
`postgres`, no password). node-pg-migrate reads the same variable directly.
