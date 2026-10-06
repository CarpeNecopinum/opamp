import { z } from 'zod';
import { sql } from 'slonik';
import { getPool } from './db.ts';

/**
 * Row schema for the `notes` table, used with `sql.type` so every query result
 * is validated at runtime and statically typed. Columns are aliased to
 * camelCase in SQL (`created_at AS "createdAt"`).
 */
const noteSchema = z.object({
	id: z.number(),
	title: z.string(),
	body: z.string().nullable(),
	createdAt: z.number()
});

export type Note = z.infer<typeof noteSchema>;

/** Input schema for creating a note — reused by form actions and server code. */
export const noteInputSchema = z.object({
	title: z.string().trim().min(1, 'Title is required').max(200),
	body: z.string().max(10_000).nullable().default(null)
});

export type NoteInput = z.infer<typeof noteInputSchema>;

const noteColumns = sql.fragment`id, title, body, created_at AS "createdAt"`;

export async function listNotes(): Promise<readonly Note[]> {
	const pool = await getPool();

	return pool.any(sql.type(noteSchema)`
		SELECT ${noteColumns}
		FROM notes
		ORDER BY created_at DESC
	`);
}

export async function createNote(input: NoteInput): Promise<Note> {
	const pool = await getPool();
	const value = noteInputSchema.parse(input);

	return pool.one(sql.type(noteSchema)`
		INSERT INTO notes (title, body)
		VALUES (${value.title}, ${value.body})
		RETURNING ${noteColumns}
	`);
}
