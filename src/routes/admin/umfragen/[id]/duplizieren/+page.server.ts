import { error, redirect } from '@sveltejs/kit';
import { surveyTitleSchema } from '#lib/schemas.ts';
import { duplicateSurvey, getSurvey } from '#lib/server/surveys.ts';
import type { PageServerLoad } from './$types';

// Duplication is triggered from the surveys overview: the "Duplizieren" link
// opens a dialog asking for a name, which then navigates here with
// ?title=... The load function mutates, so links to this route must set
// data-sveltekit-preloaddata="off" to avoid duplicates on hover.
export const load: PageServerLoad = async ({ params, url, locals }) => {
	const id = Number(params.id);
	if (!Number.isInteger(id)) error(404, 'Umfrage nicht gefunden');

	const survey = await getSurvey(id, { createdBy: locals.user!.id });
	if (!survey) error(404, 'Umfrage nicht gefunden');

	// Direct visits without the dialog fall back to the previous default name.
	const parsed = surveyTitleSchema.safeParse(
		url.searchParams.get('title') ?? `${survey.title} (Kopie)`
	);
	const title = parsed.success ? parsed.data : `${survey.title} (Kopie)`.slice(0, 200);

	const newId = await duplicateSurvey(id, locals.user!.id, title);

	redirect(303, `/admin/umfragen/${newId}`);
};
