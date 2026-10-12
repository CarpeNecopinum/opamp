import { expect, test } from '@playwright/test';
import { ADMIN_PASSWORD, ADMIN_USERNAME, login, logout } from './helpers';

test.describe('setup & authentication', () => {
	test('root admin created by the setup script can log in', async ({ page }) => {
		await login(page);

		await expect(page.locator('h1')).toHaveText('Umfragen');
		await expect(page.locator('nav')).toContainText(ADMIN_USERNAME);
		await expect(page.locator('nav')).toContainText('Benutzer');
	});

	test('rejects wrong credentials', async ({ page }) => {
		await page.goto('/anmeldung');
		await page.fill('#username', ADMIN_USERNAME);
		await page.fill('#password', 'falsches-passwort');
		await page.locator('form button[type="submit"]').click();

		await expect(page.locator('.error-message')).toHaveText(
			'Benutzername oder Passwort ist falsch.'
		);
	});

	test('setup script refuses to run twice (second account via admin UI instead)', async ({
		request
	}) => {
		// The setup script already ran in global setup; the /einrichtung route is gone.
		const response = await request.get('/einrichtung');
		expect(response.status()).toBe(404);
	});

	test('logs out and protects the admin area', async ({ page }) => {
		await login(page);
		await logout(page);

		// Admin area is protected again after logout.
		await page.goto('/admin');
		await page.waitForURL('/anmeldung');
	});

	test('anonymous users are redirected from the admin area to the login', async ({ page }) => {
		await page.goto('/admin');
		await page.waitForURL('/anmeldung');
	});
});
