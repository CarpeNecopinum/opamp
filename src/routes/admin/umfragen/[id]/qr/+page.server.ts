import { error } from '@sveltejs/kit';
import { getSurvey } from '#lib/server/surveys.ts';
import type { PageServerLoad } from './$types';

/** Fullscreen QR slide to present at the end of an event. */
export const load: PageServerLoad = async ({ params, url, locals }) => {
	const id = Number(params.id);
	if (!Number.isInteger(id)) error(404, 'Umfrage nicht gefunden');

	const user = locals.user!;
	const survey = await getSurvey(id, user.role === 'root' ? {} : { createdBy: user.id });
	if (!survey) error(404, 'Umfrage nicht gefunden');

	return { survey, origin: url.origin };
};
