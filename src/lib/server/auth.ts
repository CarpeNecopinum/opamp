import { z } from 'zod';
import { createHash, randomBytes } from 'node:crypto';
import { getPool, sql } from './db.ts';
import { verifyPassword } from './password.ts';

const sessionUserSchema = z.object({
	id: z.number(),
	username: z.string(),
	role: z.enum(['root', 'survey'])
});

/** The authenticated user, as stored in `event.locals`. */
export type SessionUser = z.infer<typeof sessionUserSchema>;

export const SESSION_COOKIE = 'opamp_session';

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

const hashToken = (token: string): string => createHash('sha256').update(token).digest('hex');

/**
 * Creates a session for a user. Returns the raw token (to be stored in a
 * cookie) and its expiry. Only a SHA-256 hash of the token is persisted.
 */
export async function createSession(userId: number): Promise<{ token: string; expires: Date }> {
	const token = randomBytes(32).toString('base64url');
	const expires = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
	const pool = await getPool();

	await pool.query(sql.typeAlias('void')`
		INSERT INTO sessions (token_hash, user_id, expires_at)
		VALUES (${hashToken(token)}, ${userId}, ${expires.toISOString()})
	`);

	return { token, expires };
}

/** Resolves a session token to the logged-in user, or `null`. */
export async function getSessionUser(token: string): Promise<SessionUser | null> {
	const pool = await getPool();

	return pool.maybeOne(sql.type(sessionUserSchema)`
		SELECT u.id, u.username, u.role
		FROM sessions s
		JOIN users u ON u.id = s.user_id
		WHERE s.token_hash = ${hashToken(token)}
			AND s.expires_at > now()
	`);
}

export async function deleteSession(token: string): Promise<void> {
	const pool = await getPool();

	await pool.query(sql.typeAlias('void')`
		DELETE FROM sessions WHERE token_hash = ${hashToken(token)}
	`);
}

/** Deletes expired sessions (housekeeping, called on login). */
export async function deleteExpiredSessions(): Promise<void> {
	const pool = await getPool();

	await pool.query(sql.typeAlias('void')`
		DELETE FROM sessions WHERE expires_at < now()
	`);
}

/** Verifies credentials against the `users` table. Returns the user or `null`. */
export async function login(username: string, password: string): Promise<SessionUser | null> {
	const pool = await getPool();

	const row = await pool.maybeOne(
		sql.type(
			z.object({
				id: z.number(),
				username: z.string(),
				role: z.enum(['root', 'survey']),
				passwordHash: z.string()
			})
		)`
			SELECT id, username, role, password_hash AS "passwordHash"
			FROM users
			WHERE username = ${username}
		`
	);

	if (!row || !(await verifyPassword(password, row.passwordHash))) return null;

	return { id: row.id, username: row.username, role: row.role };
}
