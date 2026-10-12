---
id: arch_001
title: Project stack decisions
content: SvelteKit 3 + Slonik (raw SQL + zod schemas) + node-pg-migrate with raw SQL files
importance: high
tags: database, orm, migrations, stack, sveltekit
---

We chose PostgreSQL with Slonik (not an ORM like Drizzle) because Slonik
promotes raw SQL and protects against unsafe value interpolation. Query
results are typed with zod via `sql.type` — note that in Slonik v49 this is
no longer a runtime validation (the zod schema is documentation only), so
runtime validation lives in the server actions and repositories instead.
The shared pool in `src/lib/server/db.ts` also overrides Slonik's default
`int8` parser (BigInt) with plain numbers — BigInt ids break equality checks
and Map lookups (`1n !== 1`).

Migrations use node-pg-migrate in its less-documented raw-SQL-file mode:
plain `.sql` files with `-- Up Migration` / `-- Down Migration` marker
comments, scaffolded with `migrate:create -j sql`. This keeps schema changes
reviewable as SQL diffs and avoids the pgm builder API entirely.

The postgres URL is configurable through the `DATABASE_URL` env var, declared
in `src/env.ts` with a zod schema and a default of
`postgres://postgres@localhost:5432/opamp` (dev DB on localhost, user
`postgres`, no password). node-pg-migrate reads the same variable directly.
