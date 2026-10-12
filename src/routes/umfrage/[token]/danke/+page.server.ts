import { getPublicSurveyByToken } from '#lib/server/surveys.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const survey = await getPublicSurveyByToken(params.token);

	return { title: survey?.title ?? null, token: params.token };
};
