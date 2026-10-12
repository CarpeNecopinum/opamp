---
kind: agents
---

# Project Guidelines

## Stack

- SvelteKit 3 with Svelte 5 (runes mode) and TypeScript (strict mode)
- Configuration lives in `vite.config.ts` (passed to the `sveltekit` Vite plugin) — there is no `svelte.config.js`
- The library alias is `#lib` (Node subpath imports, declared in `package.json` `imports`) — import with explicit extensions, e.g. `import { foo } from '#lib/server/foo.ts'`. Do **not** use `$lib`.
- Environment variables are declared in `src/env.ts` via `defineEnvVars` from `@sveltejs/kit/env` with zod schemas, and imported from `$app/env/private` / `$app/env/public` (the legacy `$env/*` modules are deprecated)
- Modules inside any `server` directory (e.g. `src/lib/server/`) are server-only

## Database

- PostgreSQL via [Slonik](https://github.com/gajus/slonik) with the `@slonik/pg-driver` driver factory — see `src/lib/server/db.ts` (shared lazy pool, get it with `getPool()`)
- Always write raw SQL with the `sql` tagged template; never concatenate user input into queries
- Always type query results with `sql.type(<zod schema>)` and validate inputs with zod schemas; never use `sql.unsafe` in app code. **Note:** in Slonik v49 `sql.type` no longer validates results at runtime — the zod schema is typing/documentation only, so do not rely on it for runtime validation
- Slonik's default `int8` parser returns BigInt (`1n`), which breaks comparisons/Map lookups against numbers — `src/lib/server/db.ts` overrides it to parse 64-bit ids as plain numbers; keep that override when touching pool config
- Connection string comes from the `DATABASE_URL` env var (declared in `src/env.ts`, defaults to `postgres://postgres@localhost:5432/opamp`)

## Migrations

- Migrations are **plain SQL files** in `migrations/`, run with node-pg-migrate
- Each `.sql` file contains `-- Up Migration` and `-- Down Migration` marker sections (see `migrations/20261006120000_survey_platform.sql`)
- Create new migrations with `npm run migrate:create <name> -j sql` — never write migrations as JavaScript/TypeScript builder code
- Apply with `npm run migrate:up`, revert with `npm run migrate:down`

## Commands

- `npm run dev` — dev server
- `npm run check` — typecheck (`svelte-check`); run before committing
- `npm run migrate:up` — apply pending migrations
- `npm run setup` — create the first `root` admin (interactive-free: `--username`/`--password` args, random password by default; refuses when users already exist)
- `npm run test` — Playwright e2e tests (start their own dev server on port 4173 against the `opamp_test` database; run `npx playwright install chromium` first on a fresh machine)
- Use `npm` as the package manager

## Conventions

- Database columns are `snake_case`; alias them to `camelCase` in SQL (e.g. `created_at AS "createdAt"`) so zod schemas stay camelCase
- Database access lives in `src/lib/server/` and must never be imported from client code
