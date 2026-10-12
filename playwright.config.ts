import { defineConfig } from '@playwright/test';

/** Dedicated test database — tests never touch the dev database. */
export const TEST_DB_URL =
	process.env.TEST_DB_URL ?? 'postgres://postgres@localhost:5432/opamp_test';

const PORT = 4173;

export default defineConfig({
	testDir: 'tests',
	timeout: 30_000,
	expect: { timeout: 5_000 },
	fullyParallel: false,
	use: {
		baseURL: `http://localhost:${PORT}`
	},
	webServer: {
		// Create the test database if missing, apply migrations, then start the
		// dev server against it (webServer runs before globalSetup).
		command:
			'psql "postgres://postgres@localhost:5432/postgres" -c "CREATE DATABASE opamp_test" 2>/dev/null || true; npm run migrate:up && vite dev --port 4173',
		port: PORT,
		reuseExistingServer: !process.env.CI,
		env: { DATABASE_URL: TEST_DB_URL }
	},
	globalSetup: './tests/global-setup.ts'
});
