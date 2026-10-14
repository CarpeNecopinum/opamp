import 'dotenv/config';

/**
 * All test databases carry this prefix — setup and teardown refuse to touch
 * any database outside of it, so other data on the same server (e.g. the dev
 * database) is never at risk.
 */
const SAFE_PREFIX = 'test_opamp';

/** The configured postgres connection (see .env), e.g. pointing at the dev database. */
const configuredUrl =
	process.env.DATABASE_URL ?? 'postgres://postgres@localhost:5432/opamp';

/** Optional suffix to isolate concurrent test runs (`test_opamp_<suffix>`). */
const suffix = process.env.TEST_DB_SUFFIX;

function databaseName(url: string): string {
	const name = new URL(url).pathname.replace(/^\/+|\/+$/g, '');
	if (!name) {
		throw new Error(`Kein Datenbankname in der URL: ${url}`);
	}
	return name;
}

function withDatabaseName(url: string, name: string): string {
	const parsed = new URL(url);
	parsed.pathname = `/${name}`;
	return parsed.toString();
}

/**
 * The test database: `test_opamp` by default, `test_opamp_<suffix>` when
 * `TEST_DB_SUFFIX` is set. An explicit `TEST_DB_URL` override wins.
 */
export const TEST_DB_URL =
	process.env.TEST_DB_URL ??
	withDatabaseName(configuredUrl, SAFE_PREFIX + (suffix ? `_${suffix}` : ''));

/** Name of the effective test database (parsed from TEST_DB_URL). */
export const TEST_DB_NAME = databaseName(TEST_DB_URL);

/** Maintenance connection on the same server (used for CREATE/DROP DATABASE). */
export const ADMIN_DB_URL = withDatabaseName(configuredUrl, 'postgres');

/** Suffixed or explicitly overridden databases are dropped at teardown. */
export const TEST_DB_DISPOSABLE = Boolean(suffix) || Boolean(process.env.TEST_DB_URL);
