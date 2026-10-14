import { spawnSync } from 'node:child_process';
import { createPool, createSqlTag } from 'slonik';
import { createPgDriverFactory } from '@slonik/pg-driver';
import { z } from 'zod';
import { ADMIN_DB_URL, TEST_DB_DISPOSABLE, TEST_DB_NAME, TEST_DB_URL } from './db.ts';

/**
 * Shared sql tag, mirroring src/lib/server/db.ts. Slonik v49's tag is a plain
 * object — statements are built with `sql.typeAlias('void')`, never a bare
 * `sql` template call.
 */
const sql = createSqlTag({
	typeAliases: {
		id: z.object({ id: z.number() }),
		void: z.object({}).strict()
	}
});

/** The only tables the test suite may clear — inside the test database only. */
const APP_TABLES = ['answers', 'responses', 'questions', 'surveys', 'sessions', 'users'];

const POOL_OPTIONS = { driverFactory: createPgDriverFactory() } as const;

/**
 * Safety net against misconfiguration: refuse to run unless the effective
 * test database carries the `test_opamp` prefix. Everything below (truncate,
 * drop) is name-gated, so the dev data on the same server is never touched.
 */
function assertTestDatabaseName(): void {
	if (!TEST_DB_NAME.startsWith('test_opamp') || !/^[a-z0-9_]+$/.test(TEST_DB_NAME)) {
		throw new Error(
			`Test-Datenbank "${TEST_DB_NAME}" trägt nicht das Präfix "test_opamp" — Abbruch, um versehentliche Datenverluste zu vermeiden.`
		);
	}
}

/** Creates the test database on the configured server if it doesn't exist. */
async function createDatabaseIfMissing(): Promise<void> {
	const pool = await createPool(ADMIN_DB_URL, POOL_OPTIONS);
	try {
		await pool.query(
			sql.typeAlias('void')`CREATE DATABASE ${sql.identifier([TEST_DB_NAME])}`
		);
	} catch (err) {
		const { code, originalError } = err as {
			code?: string;
			originalError?: { code?: string };
		};
		if (code !== '42P04' && originalError?.code !== '42P04') throw err;
		// 42P04 = duplicate_database — already exists, will be truncated below.
	} finally {
		await pool.end();
	}
}

/** Clears the test database, touching only the known app tables. */
async function truncateAppTables(): Promise<void> {
	const pool = await createPool(TEST_DB_URL, POOL_OPTIONS);
	try {
		await pool.query(
			sql.typeAlias('void')`
				TRUNCATE ${sql.join(
					APP_TABLES.map((table) => sql.identifier([table])),
					sql.fragment`, `
				)}
				RESTART IDENTITY CASCADE
			`
		);
	} finally {
		await pool.end();
	}
}

function runMigrations(): void {
	const result = spawnSync('npx', ['node-pg-migrate', 'up'], {
		env: { ...process.env, DATABASE_URL: TEST_DB_URL },
		stdio: 'inherit'
	});
	if (result.status !== 0) {
		throw new Error('Migrationen für die Test-Datenbank schlugen fehl.');
	}
}

function runSetupScript(): void {
	const result = spawnSync(
		'npx',
		['tsx', 'scripts/setup.ts', '--username', 'admin', '--password', 'test-passwort-1'],
		{ env: { ...process.env, DATABASE_URL: TEST_DB_URL }, stdio: 'inherit' }
	);
	if (result.status !== 0) {
		throw new Error('Setup-Skript schlug fehl — Test-Datenbank konnte nicht vorbereitet werden.');
	}
}

/** Drops the test database — only ever called for name-gated test databases. */
async function dropTestDatabase(): Promise<void> {
	const pool = await createPool(ADMIN_DB_URL, POOL_OPTIONS);
	try {
		await pool.query(
			sql.typeAlias('void')`DROP DATABASE IF EXISTS ${sql.identifier([TEST_DB_NAME])} WITH (FORCE)`
		);
	} finally {
		await pool.end();
	}
}

/**
 * Prepares the test database for the whole run: creates it on the configured
 * server if missing, applies migrations, clears the app tables and creates
 * the admin user. Returns the teardown, which removes disposable test
 * databases (suffixed runs) — the default `test_opamp` is kept for reuse.
 */
export default async function globalSetup(): Promise<() => Promise<void>> {
	assertTestDatabaseName();
	await createDatabaseIfMissing();
	runMigrations();
	await truncateAppTables();
	runSetupScript();

	return async () => {
		if (TEST_DB_DISPOSABLE) {
			await dropTestDatabase();
		}
	};
}
