import { spawnSync } from 'node:child_process';
import { createPool, sql } from 'slonik';
import { createPgDriverFactory } from '@slonik/pg-driver';
import { TEST_DB_URL } from '../playwright.config';

/**
 * Prepares a clean test database for the whole test run:
 * creates the database if missing, wipes all data, and runs the setup script
 * (which also exercises `npm run setup` itself).
 */
export default async function globalSetup(): Promise<void> {
	const adminPool = await createPool('postgres://postgres@localhost:5432/postgres', {
		driverFactory: createPgDriverFactory()
	});

	try {
		// CREATE DATABASE cannot run in a transaction — ignore if it already exists.
		await adminPool.query(sql.unsafe`CREATE DATABASE opamp_test`);
	} catch {
		// already exists
	} finally {
		await adminPool.end();
	}

	const pool = await createPool(TEST_DB_URL, { driverFactory: createPgDriverFactory() });
	try {
		await pool.query(sql.unsafe`
			TRUNCATE answers, responses, questions, surveys, sessions, users
			RESTART IDENTITY CASCADE
		`);
	} finally {
		await pool.end();
	}

	const result = spawnSync(
		'npx',
		['tsx', 'scripts/setup.ts', '--username', 'admin', '--password', 'test-passwort-1'],
		{ env: { ...process.env, DATABASE_URL: TEST_DB_URL }, stdio: 'inherit' }
	);

	if (result.status !== 0) {
		throw new Error('Setup script failed — test database could not be prepared.');
	}
}
