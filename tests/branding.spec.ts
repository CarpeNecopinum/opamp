import { expect, test } from '@playwright/test';
import { login } from './helpers';

test.describe('branding', () => {
	test('uses the opamp logo on the homepage', async ({ page }) => {
		await page.goto('/');

		await expect(page.locator('img[src*="opamp-logo"]').first()).toBeVisible();
		// The default Svelte logo must not be used anywhere.
		await expect(page.locator('img[src*="svelte"]')).toHaveCount(0);
		// The favicon points at the opamp logo.
		await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', /opamp-logo/);
	});

	test('uses the opamp logo in the admin header', async ({ page }) => {
		await login(page);

		await expect(page.locator('img[src*="opamp-logo"]').first()).toBeVisible();
	});
});
