import { defineEnvVars } from '@sveltejs/kit/env';
import { z } from 'zod';

/**
 * App environment variables.
 *
 * Values are loaded from `.env` (dev/build) or the process environment, and
 * validated at startup. Import private variables from `$app/env/private` and
 * public ones from `$app/env/public`.
 */
export const variables = defineEnvVars({
	/** PostgreSQL connection URI (see https://github.com/gajus/slonik#connection-uri). */
	DATABASE_URL: {
		description: 'PostgreSQL connection URI used by Slonik and node-pg-migrate',
		schema: z.string().min(1).default('postgres://postgres@localhost:5432/opamp')
	}
});
