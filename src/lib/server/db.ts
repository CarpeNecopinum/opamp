import { createPool, type DatabasePool } from 'slonik';
import { createPgDriverFactory } from '@slonik/pg-driver';
import { DATABASE_URL } from '$app/env/private';

let poolPromise: Promise<DatabasePool> | undefined;

/**
 * Returns the shared Slonik connection pool, created lazily on first use.
 *
 * The pool is configured with Slonik's safe defaults (aggressive timeouts,
 * connection reset, protected value interpolation). Queries must be built
 * with the `sql` tagged template; validate results with `sql.type(<zod schema>)`.
 */
export function getPool(): Promise<DatabasePool> {
	poolPromise ??= createPool(DATABASE_URL, {
		driverFactory: createPgDriverFactory(),
		poolName: 'opamp',
		maxPoolSize: 10
	});

	return poolPromise;
}
