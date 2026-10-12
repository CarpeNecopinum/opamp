import { error, fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { surveyInputSchema } from '#lib/schemas.ts';
import { deleteSurvey, getSurvey, listQuestions, updateSurvey } from '#lib/server/surveys.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const id = Number(params.id);
	if (!Number.isInteger(id)) error(404, 'Umfrage nicht gefunden');

	const user = locals.user!;

	const survey = await getSurvey(id, user.role === 'root' ? {} : { createdBy: user.id });
	if (!survey) error(404, 'Umfrage nicht gefunden');

	const questions = await listQuestions(id);

	return { survey, questions, editable: survey.responseCount === 0 };
};

export const actions: Actions = {
	update: async ({ params, request, locals }) => {
		const id = Number(params.id);

		const survey = await getSurvey(id, { createdBy: locals.user!.id });
		if (!survey) {
			return fail(404, { error: 'Umfrage nicht gefunden.' });
		}

		const data = await request.formData();

		let payload: unknown;
		try {
			payload = JSON.parse(String(data.get('payload') ?? '{}'));
		} catch {
			return fail(400, { error: 'Ungültige Formulardaten.' });
		}

		const parsed = surveyInputSchema.safeParse(payload);
		if (!parsed.success) {
			return fail(400, { error: z.prettifyError(parsed.error) });
		}

		await updateSurvey(id, parsed.data, {
			// Questions may only change while there are no responses.
			allowQuestionChanges: survey.responseCount === 0
		});

		return { success: true as const };
	},

	delete: async ({ params, locals }) => {
		const id = Number(params.id);

		const survey = await getSurvey(id, { createdBy: locals.user!.id });
		if (!survey) {
			return fail(404, { error: 'Umfrage nicht gefunden.' });
		}

		await deleteSurvey(id);

		redirect(303, '/admin');
	}
};
