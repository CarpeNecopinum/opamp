import type { Handle } from '@sveltejs/kit/hooks';
import { SESSION_COOKIE, getSessionUser } from '#lib/server/auth.ts';

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get(SESSION_COOKIE);
	event.locals.user = token ? await getSessionUser(token) : null;

	return resolve(event);
};
