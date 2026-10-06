import { z } from 'zod';
import { fail } from '@sveltejs/kit';
import { createNote, listNotes, noteInputSchema } from '#lib/server/notes.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	try {
		return { notes: await listNotes() };
	} catch (error) {
		// The database may not exist or isn't migrated yet — degrade gracefully.
		console.error('Failed to load notes — did you run `npm run migrate:up`?', error);
		return { notes: [], dbUnavailable: true };
	}
};

export const actions: Actions = {
	create: async ({ request }) => {
		const data = await request.formData();

		const result = noteInputSchema.safeParse({
			title: data.get('title'),
			body: data.get('body') || null
		});

		if (!result.success) {
			return fail(400, { error: z.prettifyError(result.error) });
		}

		await createNote(result.data);

		return { success: true as const };
	}
};
