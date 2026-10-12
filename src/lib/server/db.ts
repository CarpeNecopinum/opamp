import { createPool, createSqlTag, createTypeParserPreset, type DatabasePool } from 'slonik';
import { z } from 'zod';
import { createPgDriverFactory } from '@slonik/pg-driver';
import { DATABASE_URL } from '$app/env/private';

/**
 * Shared `sql` tag with the project's type aliases (see
 * https://github.com/gajus/slonik#type-aliases): `id` for `RETURNING id`
 * queries and `void` for statements without a useful result.
 */
export const sql = createSqlTag({
	typeAliases: {
		id: z.object({ id: z.number() }),
		void: z.object({}).strict()
	}
});

/**
 * Slonik's default `int8` parser returns BigInt values, which break equality
 * checks and Map lookups against plain numbers (`1n !== 1`). All 64-bit ids in
 * this schema are small sequence values, so parse them as numbers instead.
 */
const typeParsers = createTypeParserPreset().map((parser) =>
	parser.name === 'int8'
		? { ...parser, parse: (value: string) => Number(value) }
		: parser
);

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
		maxPoolSize: 10,
		typeParsers
	});

	return poolPromise;
}
