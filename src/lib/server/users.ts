import { z } from 'zod';
import { UniqueIntegrityConstraintViolationError } from 'slonik';
import { roleSchema, type Role } from '#lib/schemas.ts';
import { getPool, sql } from './db.ts';
import { hashPassword, verifyPassword } from './password.ts';

const userRowSchema = z.object({
	id: z.number(),
	username: z.string(),
	role: roleSchema,
	createdAt: z.number()
});

export type User = z.infer<typeof userRowSchema>;

export async function countUsers(): Promise<number> {
	const pool = await getPool();

	const result = await pool.one(
		sql.type(z.object({ count: z.number() }))`
			SELECT COUNT(*)::int AS count FROM users
		`
	);

	return result.count;
}

export async function listUsers(): Promise<readonly User[]> {
	const pool = await getPool();

	return pool.any(sql.type(userRowSchema)`
		SELECT id, username, role, created_at AS "createdAt"
		FROM users
		ORDER BY created_at DESC
	`);
}

export type CreateUserResult = { ok: true; user: User } | { ok: false; error: string };

export async function createUser(input: {
	username: string;
	password: string;
	role: Role;
}): Promise<CreateUserResult> {
	const pool = await getPool();
	const passwordHash = await hashPassword(input.password);

	try {
		const user = await pool.one(sql.type(userRowSchema)`
			INSERT INTO users (username, password_hash, role)
			VALUES (${input.username}, ${passwordHash}, ${input.role})
			RETURNING id, username, role, created_at AS "createdAt"
		`);

		return { ok: true, user };
	} catch (error) {
		if (error instanceof UniqueIntegrityConstraintViolationError) {
			return { ok: false, error: 'Dieser Benutzername ist bereits vergeben.' };
		}
		throw error;
	}
}

export type ChangePasswordResult = { ok: true } | { ok: false; error: string };

/** Verifies the current password and updates it to the new one. */
export async function changePassword(
	userId: number,
	currentPassword: string,
	newPassword: string
): Promise<ChangePasswordResult> {
	const pool = await getPool();

	const row = await pool.maybeOne(
		sql.type(z.object({ passwordHash: z.string() }))`
			SELECT password_hash AS "passwordHash"
			FROM users
			WHERE id = ${userId}
		`
	);

	if (!row || !(await verifyPassword(currentPassword, row.passwordHash))) {
		return { ok: false, error: 'Das aktuelle Passwort ist falsch.' };
	}

	const passwordHash = await hashPassword(newPassword);

	await pool.query(sql.typeAlias('void')`
		UPDATE users
		SET password_hash = ${passwordHash}
		WHERE id = ${userId}
	`);

	return { ok: true };
}
