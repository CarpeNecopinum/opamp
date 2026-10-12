import { z } from 'zod';

/** Survey question types: 1-10 agreement rating or free text. */
export const questionTypeSchema = z.enum(['agree_rating', 'free_text']);
export type QuestionType = z.infer<typeof questionTypeSchema>;

/** User roles: `root` administrates accounts, `survey` creates/manages surveys. */
export const roleSchema = z.enum(['root', 'survey']);
export type Role = z.infer<typeof roleSchema>;

export const usernameSchema = z
	.string()
	.trim()
	.min(3, 'Der Benutzername muss mindestens 3 Zeichen lang sein')
	.max(50)
	.regex(/^[a-zA-Z0-9._-]+$/, 'Erlaubt sind Buchstaben, Zahlen, ".", "_" und "-"');

export const passwordSchema = z
	.string()
	.min(8, 'Das Passwort muss mindestens 8 Zeichen lang sein')
	.max(200);

export const credentialsSchema = z.object({
	username: usernameSchema,
	password: passwordSchema
});
export type Credentials = z.infer<typeof credentialsSchema>;

export const questionInputSchema = z.object({
	type: questionTypeSchema,
	prompt: z
		.string()
		.trim()
		.min(1, 'Jede Frage braucht einen Text')
		.max(500, 'Fragetext darf höchstens 500 Zeichen lang sein'),
	required: z.boolean().default(true)
});
export type QuestionInput = z.infer<typeof questionInputSchema>;

/** Shared title rules, also used when naming a duplicated survey. */
export const surveyTitleSchema = z
	.string()
	.trim()
	.min(1, 'Die Umfrage braucht einen Titel')
	.max(200, 'Der Titel darf höchstens 200 Zeichen lang sein');

export const surveyInputSchema = z
	.object({
		title: surveyTitleSchema,
		description: z.string().trim().max(2000).optional().default(''),
		startsAt: z.coerce.date({ message: 'Bitte gib ein gültiges Startdatum an' }),
		endsAt: z.coerce.date({ message: 'Bitte gib ein gültiges Enddatum an' }),
		questions: z
			.array(questionInputSchema)
			.min(1, 'Mindestens eine Frage ist erforderlich')
			.max(50)
	})
	.refine((data) => data.endsAt > data.startsAt, {
		message: 'Das Ende muss nach dem Start liegen',
		path: ['endsAt']
	});
export type SurveyInput = z.infer<typeof surveyInputSchema>;
