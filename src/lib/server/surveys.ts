import { z } from 'zod';
import type { DatabaseTransactionConnection } from 'slonik';
import {
	questionTypeSchema,
	type QuestionType,
	type SurveyInput
} from '#lib/schemas.ts';
import { getPool, sql } from './db.ts';

const statusSchema = z.enum(['aktiv', 'bevorstehend', 'beendet']);

const surveyRowSchema = z.object({
	id: z.number(),
	token: z.uuid(),
	title: z.string(),
	description: z.string().nullable(),
	createdBy: z.number(),
	createdByUsername: z.string(),
	startsAt: z.number(),
	endsAt: z.number(),
	createdAt: z.number(),
	status: statusSchema,
	responseCount: z.number()
});

export type Survey = z.infer<typeof surveyRowSchema>;

const publicSurveySchema = surveyRowSchema.omit({ createdBy: true, createdByUsername: true });
export type PublicSurvey = z.infer<typeof publicSurveySchema>;

const questionRowSchema = z.object({
	id: z.number(),
	surveyId: z.number(),
	type: questionTypeSchema,
	prompt: z.string(),
	position: z.number(),
	required: z.boolean()
});

export type Question = z.infer<typeof questionRowSchema>;

/** Thrown when a participant submits an invalid or late response. */
export class ParticipationError extends Error {}

const surveyColumns = sql.fragment`
	s.id,
	s.token,
	s.title,
	s.description,
	s.created_by AS "createdBy",
	u.username AS "createdByUsername",
	s.starts_at AS "startsAt",
	s.ends_at AS "endsAt",
	s.created_at AS "createdAt",
	CASE
		WHEN now() < s.starts_at THEN 'bevorstehend'
		WHEN now() > s.ends_at THEN 'beendet'
		ELSE 'aktiv'
	END AS status,
	COUNT(r.id)::int AS "responseCount"
`;

/**
 * Lists surveys. `createdBy` restricts to one owner (used for the `survey`
 * role), `activeOnly` restricts to surveys currently within their window.
 */
export async function listSurveys(
	options: { createdBy?: number; activeOnly?: boolean } = {}
): Promise<readonly Survey[]> {
	const pool = await getPool();

	const ownership = options.createdBy
		? sql.fragment`s.created_by = ${options.createdBy}`
		: sql.fragment`true`;

	const activeOnly = options.activeOnly
		? sql.fragment`now() >= s.starts_at AND now() <= s.ends_at`
		: sql.fragment`true`;

	return pool.any(sql.type(surveyRowSchema)`
		SELECT ${surveyColumns}
		FROM surveys s
		JOIN users u ON u.id = s.created_by
		LEFT JOIN responses r ON r.survey_id = s.id
		WHERE ${ownership} AND ${activeOnly}
		GROUP BY s.id, u.username
		ORDER BY s.created_at DESC
	`);
}

/** Fetches a single survey; `createdBy` (if given) restricts to that owner. */
export async function getSurvey(
	id: number,
	options: { createdBy?: number } = {}
): Promise<Survey | null> {
	const pool = await getPool();

	const ownership = options.createdBy
		? sql.fragment`AND s.created_by = ${options.createdBy}`
		: sql.fragment``;

	return pool.maybeOne(sql.type(surveyRowSchema)`
		SELECT ${surveyColumns}
		FROM surveys s
		JOIN users u ON u.id = s.created_by
		LEFT JOIN responses r ON r.survey_id = s.id
		WHERE s.id = ${id} ${ownership}
		GROUP BY s.id, u.username
	`);
}

/** Public view of a survey (no owner information). */
export async function getPublicSurveyByToken(token: string): Promise<PublicSurvey | null> {
	const pool = await getPool();

	return pool.maybeOne(sql.type(publicSurveySchema)`
		SELECT ${surveyColumns}
		FROM surveys s
		JOIN users u ON u.id = s.created_by
		LEFT JOIN responses r ON r.survey_id = s.id
		WHERE s.token = ${token}
		GROUP BY s.id, u.username
	`);
}

export async function listQuestions(surveyId: number): Promise<readonly Question[]> {
	const pool = await getPool();

	return pool.any(sql.type(questionRowSchema)`
		SELECT id, survey_id AS "surveyId", type, prompt, position, required
		FROM questions
		WHERE survey_id = ${surveyId}
		ORDER BY position
	`);
}

async function insertQuestions(
	tx: DatabaseTransactionConnection,
	surveyId: number,
	questions: SurveyInput['questions']
): Promise<void> {
	if (questions.length === 0) return;

	const values = sql.join(
		questions.map((q, index) => sql.fragment`(${surveyId}, ${q.type}, ${q.prompt}, ${index}, ${q.required})`),
		sql.fragment`, `
	);

	await tx.query(sql.typeAlias('void')`
		INSERT INTO questions (survey_id, type, prompt, position, required)
		VALUES ${values}
	`);
}

export async function createSurvey(
	createdBy: number,
	input: SurveyInput
): Promise<{ id: number; token: string }> {
	const pool = await getPool();

	return pool.transaction(async (tx) => {
		const survey = await tx.one(
			sql.type(
				z.object({
					id: z.number(),
					token: z.uuid()
				})
			)`
				INSERT INTO surveys (title, description, created_by, starts_at, ends_at)
				VALUES (
					${input.title},
					${input.description || null},
					${createdBy},
					${input.startsAt.toISOString()},
					${input.endsAt.toISOString()}
				)
				RETURNING id, token
			`
		);

		await insertQuestions(tx, survey.id, input.questions);

		return survey;
	});
}

/**
 * Updates a survey. Questions are only replaced when the survey has no
 * responses yet (changing questions would invalidate existing answers).
 */
export async function updateSurvey(
	id: number,
	input: SurveyInput,
	options: { allowQuestionChanges: boolean }
): Promise<void> {
	const pool = await getPool();

	await pool.transaction(async (tx) => {
		await tx.query(sql.typeAlias('void')`
			UPDATE surveys
			SET title = ${input.title},
				description = ${input.description || null},
				starts_at = ${input.startsAt.toISOString()},
				ends_at = ${input.endsAt.toISOString()}
			WHERE id = ${id}
		`);

		if (options.allowQuestionChanges) {
			await tx.query(sql.typeAlias('void')`
				DELETE FROM questions WHERE survey_id = ${id}
			`);
			await insertQuestions(tx, id, input.questions);
		}
	});
}

export async function deleteSurvey(id: number): Promise<void> {
	const pool = await getPool();

	await pool.query(sql.typeAlias('void')`
		DELETE FROM surveys WHERE id = ${id}
	`);
}

/**
 * Duplicates a survey: copies title, description and questions, resets the
 * window (now → now + 7 days), generates a fresh token and starts without
 * responses.
 */
export async function duplicateSurvey(
	surveyId: number,
	createdBy: number,
	title: string
): Promise<number> {
	const pool = await getPool();

	return pool.transaction(async (tx) => {
		const survey = await tx.maybeOne(
			sql.type(
				z.object({
					title: z.string(),
					description: z.string().nullable()
				})
			)`
				SELECT title, description
				FROM surveys
				WHERE id = ${surveyId}
			`
		);

		if (!survey) throw new Error('Umfrage nicht gefunden.');

		const created = await tx.one(
			sql.type(z.object({ id: z.number() }))`
				INSERT INTO surveys (title, description, created_by, starts_at, ends_at)
				VALUES (
					${title.trim().slice(0, 200)},
					${survey.description},
					${createdBy},
					now(),
					now() + interval '7 days'
				)
				RETURNING id
			`
		);

		await tx.query(sql.typeAlias('void')`
			INSERT INTO questions (survey_id, type, prompt, position, required)
			SELECT ${created.id}, type, prompt, position, required
			FROM questions
			WHERE survey_id = ${surveyId}
			ORDER BY position
		`);

		return created.id;
	});
}

/**
 * Submits an anonymous response. `rawAnswers` maps question ids to the raw
 * form values. Validates required questions and value ranges per question
 * type; throws `ParticipationError` with a German message on failure.
 */
export async function submitResponse(
	surveyId: number,
	rawAnswers: ReadonlyMap<number, string>
): Promise<void> {
	const pool = await getPool();

	await pool.transaction(async (tx) => {
		const survey = await tx.maybeOne(
			sql.type(surveyRowSchema)`
				SELECT ${surveyColumns}
				FROM surveys s
				JOIN users u ON u.id = s.created_by
				LEFT JOIN responses r ON r.survey_id = s.id
				WHERE s.id = ${surveyId}
				GROUP BY s.id, u.username
			`
		);

		if (!survey) throw new ParticipationError('Umfrage nicht gefunden.');
		if (survey.status !== 'aktiv') {
			throw new ParticipationError('Diese Umfrage nimmt derzeit keine Antworten entgegen.');
		}

		const questions = await tx.any(sql.type(questionRowSchema)`
			SELECT id, survey_id AS "surveyId", type, prompt, position, required
			FROM questions
			WHERE survey_id = ${surveyId}
			ORDER BY position
		`);

		const response = await tx.one(
			sql.type(z.object({ id: z.number() }))`
				INSERT INTO responses (survey_id)
				VALUES (${surveyId})
				RETURNING id
			`
		);
		const responseId = response.id;

		const answerRows: ReturnType<typeof sql.fragment>[] = [];

		for (const question of questions) {
			const raw = rawAnswers.get(question.id)?.trim() ?? '';

			if (question.type === 'agree_rating') {
				if (raw === '') {
					if (question.required) {
						throw new ParticipationError(
							`Frage ${question.position + 1} muss beantwortet werden.`
						);
					}
					continue;
				}

				const value = z.coerce.number().int().safeParse(raw);
				if (!value.success || value.data < 1 || value.data > 10) {
					throw new ParticipationError('Bewertungen müssen zwischen 1 und 10 liegen.');
				}

				answerRows.push(sql.fragment`(${responseId}, ${question.id}, ${value.data}, NULL)`);
			} else {
				if (raw === '') {
					if (question.required) {
						throw new ParticipationError(
							`Frage ${question.position + 1} muss beantwortet werden.`
						);
					}
					continue;
				}
				if (raw.length > 10_000) {
					throw new ParticipationError('Der Text ist zu lang (max. 10.000 Zeichen).');
				}

				answerRows.push(sql.fragment`(${responseId}, ${question.id}, NULL, ${raw})`);
			}
		}

		if (answerRows.length > 0) {
			await tx.query(sql.typeAlias('void')`
				INSERT INTO answers (response_id, question_id, rating_value, text_value)
				VALUES ${sql.join(answerRows, sql.fragment`, `)}
			`);
		}
	});
}

export type SurveyResults = {
	responseCount: number;
	questions: Array<{
		id: number;
		type: QuestionType;
		prompt: string;
		position: number;
		required: boolean;
		answerCount: number;
		/** Only for `agree_rating`: average of all given ratings. */
		averageRating: number | null;
		/** Only for `agree_rating`: count per rating value 1-10. */
		distribution: Array<{ rating: number; count: number }>;
		/** Only for `free_text`: all answers, most recent first. */
		textAnswers: Array<{ value: string; submittedAt: number }>;
	}>;
};

export async function getResults(surveyId: number): Promise<SurveyResults> {
	const pool = await getPool();

	const countResult = await pool.one(
		sql.type(z.object({ count: z.number() }))`
			SELECT COUNT(*)::int AS count FROM responses WHERE survey_id = ${surveyId}
		`
	);

	const responseCount = countResult.count;

	const questions = await listQuestions(surveyId);

	const answers = await pool.any(
		sql.type(
			z.object({
				questionId: z.number(),
				ratingValue: z.number().nullable(),
				textValue: z.string().nullable(),
				submittedAt: z.number()
			})
		)`
			SELECT a.question_id AS "questionId",
				a.rating_value AS "ratingValue",
				a.text_value AS "textValue",
				r.submitted_at AS "submittedAt"
			FROM answers a
			JOIN responses r ON r.id = a.response_id
			JOIN questions q ON q.id = a.question_id
			WHERE q.survey_id = ${surveyId}
			ORDER BY r.submitted_at DESC
		`
	);

	return {
		responseCount,
		questions: questions.map((question): SurveyResults['questions'][number] => {
			const forQuestion = answers.filter((a) => a.questionId === question.id);

			if (question.type === 'agree_rating') {
				const ratings = forQuestion
					.map((a) => a.ratingValue)
					.filter((v): v is number => v !== null);

				return {
					id: question.id,
					type: question.type,
					prompt: question.prompt,
					position: question.position,
					required: question.required,
					answerCount: ratings.length,
					averageRating:
						ratings.length > 0 ? ratings.reduce((sum, v) => sum + v, 0) / ratings.length : null,
					distribution: Array.from({ length: 10 }, (_, i) => ({
						rating: i + 1,
						count: ratings.filter((v) => v === i + 1).length
					})),
					textAnswers: []
				};
			}

			return {
				id: question.id,
				type: question.type,
				prompt: question.prompt,
				position: question.position,
				required: question.required,
				answerCount: forQuestion.length,
				averageRating: null,
				distribution: [],
				textAnswers: forQuestion
					.filter((a) => a.textValue !== null)
					.map((a) => ({ value: a.textValue as string, submittedAt: a.submittedAt }))
			};
		})
	};
}
