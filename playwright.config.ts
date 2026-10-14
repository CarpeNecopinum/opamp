import { defineConfig } from '@playwright/test';
import { TEST_DB_URL } from './tests/db.ts';

const PORT = 4173;

export default defineConfig({
	testDir: 'tests',
	timeout: 30_000,
	expect: { timeout: 5_000 },
	fullyParallel: false,
	// All tests share the single test database — run them strictly sequential.
	workers: 1,
	use: {
		baseURL: `http://localhost:${PORT}`
	},
	webServer: {
		// All database preparation (create, migrate, truncate, admin user)
		// happens in global-setup; the dev server connects lazily, so it can
		// start before the database exists.
		command: 'vite dev --port 4173',
		port: PORT,
		reuseExistingServer: !process.env.CI,
		env: { DATABASE_URL: TEST_DB_URL }
	},
	globalSetup: './tests/global-setup.ts'
});
