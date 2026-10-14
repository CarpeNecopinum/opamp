import { expect, test } from '@playwright/test';
import {
	answerFreeText,
	answerRating,
	createSurveyViaUI,
	createSurveyUserViaUI,
	login,
	logout,
	submitResponse
} from './helpers';

test.describe('survey administration', () => {
	test('root can create a survey user (role survey)', async ({ page }) => {
		await login(page);
		await createSurveyUserViaUI(page, 'surveyer', 'survey-passwort-1');

		const table = page.locator('table');
		await expect(table).toContainText('surveyer');
		await expect(table).toContainText('Umfrage-Ersteller');
	});

	test('survey role can log in and cannot access user management', async ({ page }) => {
		await login(page, 'surveyer', 'survey-passwort-1');

		// No "Benutzer" navigation entry for the survey role.
		await expect(page.locator('nav')).not.toContainText('Benutzer');

		// Direct access is redirected back to the admin area.
		await page.goto('/admin/benutzer');
		await page.waitForURL('/admin');
	});

	test('creates a survey with both question types and shows the participant link', async ({
		page
	}) => {
		await login(page);

		const token = await createSurveyViaUI(page, {
			title: 'Team-Zufriedenheit',
			description: 'Kurze Umfrage zum Projekt',
			startsAt: '2026-10-07T09:00',
			endsAt: '2026-10-20T18:00',
			questions: [
				{ type: 'agree_rating', prompt: 'Wie sehr stimmst du dieser Meinung zu?' },
				{ type: 'free_text', prompt: 'Was können wir verbessern?', required: false }
			]
		});

		// Participant link is present, unguessable and does not expose the numeric id.
		await expect(page.locator('.survey-link')).toContainText(`/umfrage/${token}`);
		expect(token).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
	});

	test('edits a survey while it has no responses', async ({ page }) => {
		await login(page);

		await createSurveyViaUI(page, {
			title: 'Altes Titelblatt',
			startsAt: '2026-10-07T09:00',
			endsAt: '2026-10-20T18:00',
			questions: [{ type: 'free_text', prompt: 'Feedback?' }]
		});

		await page.fill('#title', 'Neues Titelblatt');
		await page.getByRole('button', { name: 'Änderungen speichern' }).click();

		await expect(page.locator('.success-message')).toHaveText('Änderungen gespeichert.');
		await expect(page.locator('h1')).toHaveText('Neues Titelblatt');
	});

	test('shows aggregated results after participation', async ({ page }) => {
		await login(page);

		const token = await createSurveyViaUI(page, {
			title: 'Ergebnis-Test',
			startsAt: '2026-10-07T09:00',
			endsAt: '2026-10-20T18:00',
			questions: [
				{ type: 'agree_rating', prompt: 'Wie sehr stimmst du dieser Meinung zu?' },
				{ type: 'free_text', prompt: 'Was können wir verbessern?', required: false }
			]
		});

		// One anonymous participant answers.
		await page.goto(`/umfrage/${token}`);
		await answerRating(page, 'Wie sehr stimmst du dieser Meinung zu?', 8);
		await answerFreeText(page, 'Was können wir verbessern?', 'Mehr Kaffee, bitte.');
		await submitResponse(page);
		await page.waitForURL(/\/umfrage\/[0-9a-f-]{36}\/danke$/);

		// Results are visible in the admin area.
		await page.goto('/admin');
		await page.getByRole('link', { name: 'Ergebnis-Test' }).click();

		await expect(page.locator('h2', { hasText: 'Ergebnisse' })).toBeVisible();
		await expect(page.locator('body')).toContainText('1 Antwort');
		await expect(page.locator('body')).toContainText('8');
		await expect(page.locator('body')).toContainText('Mehr Kaffee, bitte.');
	});

	test('duplicates a survey with fresh dates and no responses', async ({ page }) => {
		await login(page);

		const token = await createSurveyViaUI(page, {
			title: 'Original-Umfrage',
			startsAt: '2026-10-07T09:00',
			endsAt: '2026-10-20T18:00',
			questions: [
				{ type: 'agree_rating', prompt: 'Wie sehr stimmst du dieser Meinung zu?' },
				{ type: 'free_text', prompt: 'Was können wir verbessern?', required: false }
			]
		});

		// One anonymous response on the original survey.
		await logout(page);
		await page.goto(`/umfrage/${token}`);
		await answerRating(page, 'Wie sehr stimmst du dieser Meinung zu?', 5);
		await submitResponse(page);
		await page.waitForURL(/danke/);

		// Duplicate via the surveys overview (dialog, explicit confirmation).
		await login(page);
		await page.goto('/admin');
		await waitForHydration(page);
		await page
			.locator('tr', { hasText: 'Original-Umfrage' })
			.getByRole('link', { name: 'Duplizieren' })
			.click();
		await page.fill('#duplicate-name', 'Original-Umfrage (Kopie)');
		await page.getByRole('button', { name: 'Kopie erstellen' }).click();
		await page.waitForURL(/\/admin\/umfragen\/\d+$/);

		// The copy acts like a fresh survey.
		await expect(page.locator('h1')).toHaveText('Original-Umfrage (Kopie)');
		await expect(page.locator('body')).toContainText('0 Antworten');

		// Questions were copied.
		await expect(page.locator('#prompt-0')).toHaveValue('Wie sehr stimmst du dieser Meinung zu?');
		await expect(page.locator('#prompt-1')).toHaveValue('Was können wir verbessern?');

		// Dates were reset (no longer the original window).
		await expect(page.locator('#startsAt')).not.toHaveValue('2026-10-07T09:00');
		await expect(page.locator('#endsAt')).not.toHaveValue('2026-10-20T18:00');
	});

	test('deletes a survey', async ({ page }) => {
		await login(page);

		await createSurveyViaUI(page, {
			title: 'Zum Löschen',
			startsAt: '2026-10-07T09:00',
			endsAt: '2026-10-20T18:00',
			questions: [{ type: 'free_text', prompt: 'Feedback?' }]
		});

		page.once('dialog', (dialog) => dialog.accept());
		await page.getByRole('button', { name: 'Umfrage löschen' }).click();

		await page.waitForURL('/admin');
		await expect(page.locator('body')).not.toContainText('Zum Löschen');
	});

	test('survey role sees only its own surveys, root sees all', async ({ page }) => {
		await login(page);

		await createSurveyViaUI(page, {
			title: 'Umfrage vom Root',
			startsAt: '2026-10-07T09:00',
			endsAt: '2026-10-20T18:00',
			questions: [{ type: 'free_text', prompt: 'Feedback?' }]
		});

		await logout(page);
		await login(page, 'surveyer', 'survey-passwort-1');
		await createSurveyViaUI(page, {
			title: 'Umfrage vom Survey-User',
			startsAt: '2026-10-07T09:00',
			endsAt: '2026-10-20T18:00',
			questions: [{ type: 'free_text', prompt: 'Feedback?' }]
		});

		// Survey role only sees its own survey.
		await page.goto('/admin');
		await expect(page.locator('table')).toContainText('Umfrage vom Survey-User');
		await expect(page.locator('table')).not.toContainText('Umfrage vom Root');

		// Root sees both surveys.
		await logout(page);
		await login(page);
		await expect(page.locator('table')).toContainText('Umfrage vom Survey-User');
		await expect(page.locator('table')).toContainText('Umfrage vom Root');
	});
});
