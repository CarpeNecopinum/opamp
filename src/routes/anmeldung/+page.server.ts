import { dev } from '$app/env';
import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import {
	SESSION_COOKIE,
	createSession,
	deleteExpiredSessions,
	login
} from '#lib/server/auth.ts';
import { credentialsSchema } from '#lib/schemas.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) redirect(303, '/admin');

	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const parsed = credentialsSchema.safeParse(
			Object.fromEntries(await request.formData())
		);

		if (!parsed.success) {
			return fail(400, { error: z.prettifyError(parsed.error) });
		}

		const user = await login(parsed.data.username, parsed.data.password);
		if (!user) {
			return fail(400, { error: 'Benutzername oder Passwort ist falsch.' });
		}

		await deleteExpiredSessions();
		const { token, expires } = await createSession(user.id);

		cookies.set(SESSION_COOKIE, token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: !dev,
			expires
		});

		redirect(303, '/admin');
	}
};
