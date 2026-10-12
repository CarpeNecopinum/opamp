import { listSurveys } from '#lib/server/surveys.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user!;

	// Root sees all surveys, survey creators only their own.
	const surveys = await listSurveys(user.role === 'root' ? {} : { createdBy: user.id });

	return { surveys, isRoot: user.role === 'root' };
};
