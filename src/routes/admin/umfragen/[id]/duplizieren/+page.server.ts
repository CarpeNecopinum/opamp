import { error, fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { surveyTitleSchema } from '#lib/schemas.ts';
import { duplicateSurvey, getSurvey } from '#lib/server/surveys.ts';
import type { Actions, PageServerLoad } from './$types';

/**
 * No mutation in load: duplication happens only via the POST action below,
 * after the name was explicitly confirmed (dialog in the overview or the
 * form on this page). Never duplicate on GET — hover preloading and
 * prefetching would otherwise create copies.
 */
export const load: PageServerLoad = async ({ params, locals }) => {
	const id = Number(params.id);
	if (!Number.isInteger(id)) error(404, 'Umfrage nicht gefunden');

	const user = locals.user!;
	const survey = await getSurvey(id, user.role === 'root' ? {} : { createdBy: user.id });
	if (!survey) error(404, 'Umfrage nicht gefunden');

	return { title: survey.title, defaultName: `${survey.title} (Kopie)`.slice(0, 200) };
};

export const actions: Actions = {
	default: async ({ params, request, locals }) => {
		const id = Number(params.id);
		if (!Number.isInteger(id)) {
			return fail(404, { error: 'Umfrage nicht gefunden.' });
		}

		const user = locals.user!;
		const survey = await getSurvey(id, user.role === 'root' ? {} : { createdBy: user.id });
		if (!survey) {
			return fail(404, { error: 'Umfrage nicht gefunden.' });
		}

		const data = await request.formData();

		const parsed = surveyTitleSchema.safeParse(String(data.get('title') ?? ''));
		if (!parsed.success) {
			return fail(400, { error: z.prettifyError(parsed.error) });
		}

		const newId = await duplicateSurvey(id, user.id, parsed.data);

		redirect(303, `/admin/umfragen/${newId}`);
	}
};
