import { expect, test } from '@playwright/test';
import {
	answerFreeText,
	answerRating,
	createSurveyViaUI,
	login,
	logout,
	submitResponse
} from './helpers';

test.describe('participation (public, via token link)', () => {
	test('accepts an anonymous response via the token link', async ({ page }) => {
		await login(page);

		const token = await createSurveyViaUI(page, {
			title: 'Teilnahme-Test',
			description: 'Anonym teilnehmen',
			startsAt: '2026-10-07T09:00',
			endsAt: '2026-10-20T18:00',
			questions: [
				{ type: 'agree_rating', prompt: 'Wie sehr stimmst du dieser Meinung zu?' },
				{ type: 'free_text', prompt: 'Was können wir verbessern?', required: false }
			]
		});

		await logout(page);

		// The survey is NOT listed on the homepage — only the token link works.
		await page.goto('/');
		await expect(page.locator('body')).toContainText('Feedback-Plattform');
		await expect(page.locator('a[href^="/umfrage/"]')).toHaveCount(0);

		await page.goto(`/umfrage/${token}`);
		await expect(page.locator('h1')).toHaveText('Teilnahme-Test');
		await expect(page.locator('body')).not.toContainText('Zeitraum');

		await answerRating(page, 'Wie sehr stimmst du dieser Meinung zu?', 7);
		await answerFreeText(page, 'Was können wir verbessern?', 'Weniger Meetings.');
		await submitResponse(page);

		await page.waitForURL(/\/umfrage\/[0-9a-f-]{36}\/danke$/);
		await expect(page.locator('h1')).toHaveText('Vielen Dank!');
		await expect(page.locator('body')).toContainText('Teilnahme-Test');
	});

	test('rejects submission when a required question is unanswered', async ({ page }) => {
		await login(page);

		const token = await createSurveyViaUI(page, {
			title: 'Pflichtfeld-Test',
			startsAt: '2026-10-07T09:00',
			endsAt: '2026-10-20T18:00',
			questions: [
				{ type: 'agree_rating', prompt: 'Wie sehr stimmst du dieser Meinung zu?' },
				{ type: 'free_text', prompt: 'Was können wir verbessern?', required: false }
			]
		});

		await logout(page);

		await page.goto(`/umfrage/${token}`);
		// Only the optional free-text question is answered, the required rating is not.
		await answerFreeText(page, 'Was können wir verbessern?', 'Nur Freitext.');
		await submitResponse(page);

		await expect(page.locator('.error-message')).toContainText('muss beantwortet werden');

		// Stays on the form, no thank-you redirect.
		await expect(page).not.toHaveURL(/danke/);
	});

	test('shows a 404 for unguessable/unknown tokens', async ({ page }) => {
		await page.goto('/umfrage/00000000-0000-4000-8000-000000000000');
		await expect(page.locator('body')).toContainText('404');

		// The numeric id route is gone — tokens cannot be enumerated via ids.
		await page.goto('/umfrage/1');
		await expect(page.locator('body')).toContainText('404');
	});

	test('refuses participation outside the time window', async ({ page }) => {
		await login(page);

		// Survey whose window has already ended.
		const endedToken = await createSurveyViaUI(page, {
			title: 'Beendete Umfrage',
			startsAt: '2026-01-01T09:00',
			endsAt: '2026-01-02T09:00',
			questions: [{ type: 'free_text', prompt: 'Feedback?' }]
		});

		await logout(page);

		await page.goto(`/umfrage/${endedToken}`);
		await expect(page.locator('.badge.beendet')).toHaveText('beendet');
		await expect(page.locator('form')).toHaveCount(0);
	});

	test('refuses participation before the time window starts', async ({ page }) => {
		await login(page);

		const upcomingToken = await createSurveyViaUI(page, {
			title: 'Zukünftige Umfrage',
			startsAt: '2026-12-01T09:00',
			endsAt: '2026-12-31T18:00',
			questions: [{ type: 'free_text', prompt: 'Feedback?' }]
		});

		await logout(page);

		await page.goto(`/umfrage/${upcomingToken}`);
		await expect(page.locator('.badge.bevorstehend')).toHaveText('bevorstehend');
		await expect(page.locator('form')).toHaveCount(0);
	});
});
