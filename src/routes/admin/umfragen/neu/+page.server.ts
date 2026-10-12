import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { surveyInputSchema } from '#lib/schemas.ts';
import { createSurvey } from '#lib/server/surveys.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
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

		const survey = await createSurvey(locals.user!.id, parsed.data);

		redirect(303, `/admin/umfragen/${survey.id}`);
	}
};
