import { error, fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import {
	ParticipationError,
	getPublicSurveyByToken,
	listQuestions,
	submitResponse
} from '#lib/server/surveys.ts';
import type { Actions, PageServerLoad } from './$types';

const tokenSchema = z.uuid();

export const load: PageServerLoad = async ({ params }) => {
	const parsed = tokenSchema.safeParse(params.token);
	if (!parsed.success) error(404, 'Umfrage nicht gefunden');

	const survey = await getPublicSurveyByToken(parsed.data);
	if (!survey) error(404, 'Umfrage nicht gefunden');

	if (survey.status !== 'aktiv') {
		return { survey, questions: [], closed: true };
	}

	return { survey, questions: await listQuestions(survey.id), closed: false };
};

export const actions: Actions = {
	default: async ({ params, request }) => {
		const parsed = tokenSchema.safeParse(params.token);
		if (!parsed.success) {
			return fail(404, { error: 'Umfrage nicht gefunden.' });
		}

		const survey = await getPublicSurveyByToken(parsed.data);
		if (!survey) {
			return fail(404, { error: 'Umfrage nicht gefunden.' });
		}

		if (survey.status !== 'aktiv') {
			return fail(403, { error: 'Diese Umfrage nimmt derzeit keine Antworten entgegen.' });
		}

		const formData = await request.formData();

		const rawAnswers = new Map<number, string>();
		for (const [name, value] of formData.entries()) {
			if (name.startsWith('answer_') && typeof value === 'string') {
				const questionId = Number(name.slice('answer_'.length));
				if (Number.isInteger(questionId)) rawAnswers.set(questionId, value);
			}
		}

		try {
			await submitResponse(survey.id, rawAnswers);
		} catch (err) {
			if (err instanceof ParticipationError) {
				return fail(400, { error: err.message });
			}
			throw err;
		}

		redirect(303, `/umfrage/${parsed.data}/danke`);
	}
};
