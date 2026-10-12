import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { credentialsSchema, roleSchema } from '#lib/schemas.ts';
import { createUser, listUsers } from '#lib/server/users.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user!.role !== 'root') redirect(303, '/admin');

	return { users: await listUsers() };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (locals.user!.role !== 'root') {
			return fail(403, { error: 'Keine Berechtigung.' });
		}

		const formData = await request.formData();

		const role = roleSchema.safeParse(formData.get('role'));
		if (!role.success) {
			return fail(400, { error: 'Ungültige Rolle.' });
		}

		const parsed = credentialsSchema.safeParse({
			username: formData.get('username'),
			password: formData.get('password')
		});
		if (!parsed.success) {
			return fail(400, { error: z.prettifyError(parsed.error) });
		}

		const result = await createUser({ ...parsed.data, role: role.data });

		if (!result.ok) {
			return fail(400, { error: result.error });
		}

		return { success: true as const };
	}
};
