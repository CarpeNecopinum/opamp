---
id: arch_002
title: SvelteKit 3 / Slonik v49 gotchas found while building the survey platform
content: SvelteKit 3 reserved action names, enhance FormData snapshot, hydration marker for tests, Playwright setup
importance: high
tags: sveltekit, forms, testing, playwright, gotchas
---

Gotchas discovered while building and testing the survey platform:

- **Reserved action name**: in SvelteKit 3, `default` is a reserved action
  name — posting to an explicit `?/default` URL fails with a 500
  (`action_name_reserved`). A form targeting the default action must omit the
  `action` attribute entirely. `SurveyForm.svelte` takes an `action` prop that
  defaults to `''` (omitted) and the survey manage page passes `?/update`.
- **`use:enhance` FormData snapshot**: SvelteKit 3 captures the `FormData`
  *before* running the submit callback, but builds the request body *after* it.
  Mutating the `formData` argument inside the callback (e.g.
  `formData.set('payload', buildPayload())`) is what reaches the server;
  writing to a hidden input via `bind:this` is too late.
- **Hydration marker for tests**: clicks on JS-dependent controls (theme
  toggle, `use:enhance` forms) are no-ops before hydration. `ThemeToggle`
  (rendered in the root layout, on every page) sets `data-hydrated="true"` on
  itself in `onMount`; tests wait for it via `waitForHydration()` in
  `tests/helpers.ts` before interacting. It must only be rendered in the root
  layout — a second instance in the admin layout breaks strict-mode locators.
- **Playwright setup**: tests run against the `test_opamp` database (derived
  from the configured `DATABASE_URL` server; `TEST_DB_SUFFIX` isolates
  concurrent runs). `playwright.config.ts` only boots the dev server — all
  database preparation (create, migrate, truncate, admin user) happens in
  `tests/global-setup.ts`, which returns the teardown. The test admin is
  `admin` / `test-passwort-1`.
- **`data-sveltekit-preload-data` spelling**: the attribute is spelled with
  two hyphens — `data-sveltekit-preloaddata` is unknown and silently ignored.
  With `data-sveltekit-preload-data="hover"` on `<body>`, an unintended
  preload runs the route's `load` function on hover.
- **Never mutate in `load`**: SvelteKit runs `load` on hover preloads and
  prefetches. The survey duplication route originally duplicated in `load`,
  which created copies on hover. Mutations belong in form actions (POST) —
  duplication now only happens when the name form/dialog is explicitly
  submitted.
- **Slonik v49 tag is a plain object**: `sql` (and `createSqlTag()`) cannot
  be called as a template tag. Build statements with `sql.typeAlias('void')`
  or `sql.type(schema)`, and identifiers with `sql.identifier([...])`.
