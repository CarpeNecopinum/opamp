import { error } from '@sveltejs/kit';
import { getResults, getSurvey } from '#lib/server/surveys.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const id = Number(params.id);
	if (!Number.isInteger(id)) error(404, 'Umfrage nicht gefunden');

	const user = locals.user!;

	const survey = await getSurvey(id, user.role === 'root' ? {} : { createdBy: user.id });
	if (!survey) error(404, 'Umfrage nicht gefunden');

	const results = await getResults(id);

	return { survey, results };
};
