# opamp

A [SvelteKit 3](https://svelte.dev/blog/sveltekit-3-is-here) application with PostgreSQL via [Slonik](https://github.com/gajus/slonik) (zod-validated raw SQL) and raw SQL migrations via [node-pg-migrate](https://github.com/salsita/node-pg-migrate).

## Stack

- **SvelteKit 3** / Svelte 5 / TypeScript — config lives in `vite.config.ts`, library alias is `#lib`
- **Slonik** (`@slonik/pg-driver`) — connection pool in `src/lib/server/db.ts`; queries are raw SQL via the `sql` tag, results validated at runtime with **zod** via `sql.type`
- **node-pg-migrate** — migrations are plain `.sql` files in `migrations/` with `-- Up Migration` / `-- Down Migration` marker sections (not JavaScript builder code)
- **Environment variables** — declared in `src/env.ts` with `defineEnvVars` + zod; imported from `$app/env/private`

## Setup

```sh
npm install
cp .env.example .env   # adjust DATABASE_URL if needed
npm run migrate:up     # create tables
npm run dev -- --open
```

## Configuration

| Variable       | Default                                    | Description                 |
| -------------- | ------------------------------------------ | --------------------------- |
| `DATABASE_URL` | `postgres://postgres@localhost:5432/opamp` | PostgreSQL connection URI   |

Set it in `.env` (git-ignored) or the process environment. Slonik and node-pg-migrate both use it.

## Migrations

Migrations are raw SQL files in `migrations/`:

```sql
-- Up Migration
CREATE TABLE "notes" ( ... );

-- Down Migration
DROP TABLE "notes";
```

| Command                              | Description                                  |
| ------------------------------------ | -------------------------------------------- |
| `npm run migrate:create <name>`      | Scaffold a new timestamped `.sql` migration  |
| `npm run migrate:up`                 | Apply pending migrations                     |
| `npm run migrate:down`               | Revert the last migration                    |
| `npm run migrate:redo`               | Revert and re-apply the last migration       |

## Agent configuration

Agent-facing project guidelines follow the [.agents protocol](https://dotagentsprotocol.com/) in `.agents/`:

- `.agents/agents.md` — project guidelines (stack, database conventions, commands)
- `.agents/skills/db-migration/skill.md` — how to add raw SQL migrations
- `.agents/memories/arch-decisions.md` — why this stack was chosen

## Building

```sh
npm run build
npm run preview
```
