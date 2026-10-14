# opamp

opamp is a lightweight feedback platform for surveys after events, workshops and meetings.
Organizers create a survey with a mix of rating and free-text questions, share it via an
unguessable link or QR code, and get an aggregated, printable statistics report of the
anonymous responses.

## Features

- **Surveys with a time window** — each survey has a start and end date; it only accepts
  responses while it is active (`aktiv`), and is marked `bevorstehend` or `beendet`
  otherwise.
- **Two question types** — 1–10 agreement ratings and free-text questions, each optional
  or required. Question mix can be edited as long as no responses exist.
- **Anonymous participation** — surveys are shared via an unguessable token link
  (`/umfrage/<token>`); responses are not tied to accounts.
- **QR codes** — every survey's management page shows a QR code of the participant link,
  and a dedicated fullscreen slide page to present at the end of an event, leading
  attendees straight to the feedback page.
- **Duplicate guard** — after submitting, the survey token is stored hashed in the
  browser's local storage; reopening the questionnaire warns about likely duplicate
  submissions before letting the attendee continue.
- **Statistics page** — a combined box/violin overview of all rating questions (click a
  question for its histogram and details), free-text answers sorted by length, and a
  print-ready report view with a counts table per question ("Statistik drucken").
- **Survey management** — create, edit, duplicate (with a name dialog and a
  hover-safe dedicated route) and delete surveys. `root` users manage all surveys and
  accounts, `survey` users only their own.
- **Light/dark theme** — follows the browser preference, overridable per device.

## Getting started

```sh
npm install
cp .env.example .env   # adjust DATABASE_URL if needed
npm run migrate:up     # create tables
npm run setup          # create the first root admin (prints a random password)
npm run dev -- --open
```

`npm run setup` refuses to run when accounts already exist; further users are created in
the admin area (`Benutzer`) by a `root` admin.

## Configuration

| Variable       | Default                                    | Description               |
| -------------- | ------------------------------------------ | ------------------------- |
| `DATABASE_URL` | `postgres://postgres@localhost:5432/opamp` | PostgreSQL connection URI |

Set it in `.env` (git-ignored) or the process environment.

## Testing

```sh
npx playwright install chromium   # once per machine
npm run test
```

The e2e suite starts its own dev server on port 4173 against a separate `test_opamp`
database (created from the configured `DATABASE_URL` server; set `TEST_DB_SUFFIX` to
isolate concurrent runs). Existing databases on the server are never touched.

## Building

```sh
npm run build
npm run preview
```

## Migrations

Schema changes are raw SQL files in `migrations/`, applied with node-pg-migrate:

| Command                         | Description                                 |
| ------------------------------- | ------------------------------------------- |
| `npm run migrate:create <name>` | Scaffold a new timestamped `.sql` migration |
| `npm run migrate:up`            | Apply pending migrations                    |
| `npm run migrate:down`          | Revert the last migration                   |
| `npm run migrate:redo`          | Revert and re-apply the last migration      |

## Agent configuration

Agent-facing project guidelines follow the [.agents protocol](https://dotagentsprotocol.com/) in `.agents/`:

- `.agents/agents.md` — project guidelines (stack, database conventions, commands)
- `.agents/skills/db-migration/skill.md` — how to add raw SQL migrations
- `.agents/memories/arch-decisions.md` — why this stack was chosen
