import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import { createPool, sql } from 'slonik';
import { createPgDriverFactory } from '@slonik/pg-driver';
import { z } from 'zod';
import { hashPassword } from '../src/lib/server/password.ts';

/**
 * First-run setup: creates the initial `root` administrator.
 *
 * Usage:
 *   npm run setup                          # username "admin", random password
 *   npm run setup -- --username chef       # custom username
 *   npm run setup -- --username chef --password "s3cret!"
 */
function getArg(name: string): string | undefined {
	const index = process.argv.indexOf(`--${name}`);
	return index !== -1 ? process.argv[index + 1] : undefined;
}

const username = getArg('username') ?? 'admin';
const password = getArg('password') ?? randomBytes(12).toString('base64url');

const usernameSchema = z
	.string()
	.min(3, 'Der Benutzername muss mindestens 3 Zeichen lang sein')
	.max(50)
	.regex(/^[a-zA-Z0-9._-]+$/, 'Erlaubt sind Buchstaben, Zahlen, ".", "_" und "-"');
const passwordSchema = z.string().min(8, 'Das Passwort muss mindestens 8 Zeichen lang sein');

const parsedUsername = usernameSchema.safeParse(username);
if (!parsedUsername.success) {
	console.error(`Ungültiger Benutzername: ${z.prettifyError(parsedUsername.error)}`);
	process.exit(1);
}

const parsedPassword = passwordSchema.safeParse(password);
if (!parsedPassword.success) {
	console.error(`Ungültiges Passwort: ${z.prettifyError(parsedPassword.error)}`);
	process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
	console.error('DATABASE_URL ist nicht gesetzt (siehe .env).');
	process.exit(1);
}

const pool = await createPool(databaseUrl, { driverFactory: createPgDriverFactory() });

try {
	const existing = await pool.one(
		sql.type(z.object({ count: z.number() }))`
			SELECT COUNT(*)::int AS count FROM users
		`
	);

	if (existing.count > 0) {
		console.error(
			'Es existieren bereits Konten. Die Einrichtung wurde bereits abgeschlossen.\n' +
				'Root-Administratoren können weitere Konten in der Verwaltung anlegen.'
		);
		process.exit(1);
	}

	const passwordHash = await hashPassword(parsedPassword.data);

	const user = await pool.one(
		sql.type(
			z.object({
				id: z.number(),
				username: z.string(),
				role: z.enum(['root', 'survey'])
			})
		)`
			INSERT INTO users (username, password_hash, role)
			VALUES (${parsedUsername.data}, ${passwordHash}, 'root')
			RETURNING id, username, role
		`
	);

	console.log('Root-Administrator wurde angelegt:');
	console.log(`  Benutzername: ${user.username}`);
	console.log(`  Passwort:     ${parsedPassword.data}`);
	console.log();
	console.log('Bitte das Passwort sicher aufbewahren – es wird nicht erneut angezeigt.');
} finally {
	await pool.end();
}
