import { expect, type Page } from '@playwright/test';

export const ADMIN_USERNAME = 'admin';
export const ADMIN_PASSWORD = 'test-passwort-1';

export type QuestionSpec = {
	type: 'agree_rating' | 'free_text';
	prompt: string;
	required?: boolean;
};

/**
 * Waits for Svelte hydration to complete. The theme toggle lives in the root
 * layout (on every page) and marks itself with `data-hydrated` in `onMount`.
 * Clicks on JS-dependent controls (theme toggle, `use:enhance` forms) are
 * no-ops before hydration.
 */
export async function waitForHydration(page: Page): Promise<void> {
	await expect(page.locator('.theme-toggle')).toHaveAttribute('data-hydrated', 'true');
}

/** Logs in via the login form and waits for the admin area. */
export async function login(
	page: Page,
	username: string = ADMIN_USERNAME,
	password: string = ADMIN_PASSWORD
): Promise<void> {
	await page.goto('/anmeldung');
	await page.fill('#username', username);
	await page.fill('#password', password);
	await page.locator('main form button[type="submit"]').click();
	await page.waitForURL('/admin');
}

/** Logs out via the "Abmelden" button in the admin header. */
export async function logout(page: Page): Promise<void> {
	await page.locator('nav form button[type="submit"]').click();
	await page.waitForURL('/anmeldung');
}

/**
 * Creates a survey via the admin UI and returns its unguessable participant
 * token (extracted from the participant link on the manage page).
 */
export async function createSurveyViaUI(
	page: Page,
	options: {
		title: string;
		description?: string;
		startsAt: string; // datetime-local format: YYYY-MM-DDTHH:mm
		endsAt: string;
		questions: QuestionSpec[];
	}
): Promise<string> {
	await page.goto('/admin/umfragen/neu');
	await waitForHydration(page);
	await page.fill('#title', options.title);
	if (options.description) await page.fill('#description', options.description);
	await page.fill('#startsAt', options.startsAt);
	await page.fill('#endsAt', options.endsAt);

	for (let index = 0; index < options.questions.length; index++) {
		if (index > 0) {
			await page.getByRole('button', { name: 'Frage hinzufügen' }).click();
		}

		const question = options.questions[index];
		await page.selectOption(`#type-${index}`, question.type);
		await page.fill(`#prompt-${index}`, question.prompt);

		if (question.required === false) {
			await page
				.locator('fieldset.question')
				.nth(index)
				.locator('input[type="checkbox"]')
				.uncheck();
		}
	}

	await page.locator('main form button[type="submit"]').click();
	await page.waitForURL(/\/admin\/umfragen\/\d+$/);

	const linkText = await page.locator('.survey-link').textContent();
	const token = linkText?.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/)?.[1];

	if (!token) {
		throw new Error(`Participant link not found on manage page: ${linkText}`);
	}

	return token;
}

/** Fills one rating question (fieldset containing the prompt) with the given value. */
export async function answerRating(page: Page, prompt: string, value: number): Promise<void> {
	const fieldset = page.locator('fieldset.question').filter({ hasText: prompt });
	await fieldset.locator(`input[type="radio"][value="${value}"]`).check();
}

/** Fills one free-text question (fieldset containing the prompt). */
export async function answerFreeText(page: Page, prompt: string, value: string): Promise<void> {
	const fieldset = page.locator('fieldset.question').filter({ hasText: prompt });
	await fieldset.locator('textarea').fill(value);
}

/** Submits the participation form. */
export async function submitResponse(page: Page): Promise<void> {
	await page.getByRole('button', { name: 'Antworten absenden' }).click();
}

/** Creates a survey user via the root's user management page. */
export async function createSurveyUserViaUI(
	page: Page,
	username: string,
	password: string
): Promise<void> {
	await page.goto('/admin/benutzer');
	await page.fill('#username', username);
	await page.fill('#password', password);
	await page.locator('main form button[type="submit"]').click();
	await expect(page.locator('.success-message')).toBeVisible();
}
