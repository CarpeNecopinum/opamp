import { expect, test } from '@playwright/test';
import { waitForHydration } from './helpers';

test.describe('dark mode toggle', () => {
	test('defaults to the browser preference (dark)', async ({ page }) => {
		await page.emulateMedia({ colorScheme: 'dark' });
		await page.goto('/');
		await waitForHydration(page);

		await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
	});

	test('defaults to the browser preference (light)', async ({ page }) => {
		await page.emulateMedia({ colorScheme: 'light' });
		await page.goto('/');
		await waitForHydration(page);

		await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
	});

	test('toggle switches the theme and persists after reload', async ({ page }) => {
		await page.emulateMedia({ colorScheme: 'light' });
		await page.goto('/');
		await waitForHydration(page);

		await page.getByRole('button', { name: 'Dunkles Design aktivieren' }).click();
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

		// The stored preference wins over the system preference after a reload.
		await page.reload();
		await waitForHydration(page);
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

		await page.getByRole('button', { name: 'Helles Design aktivieren' }).click();
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
	});

	test('toggle is available on public and admin pages', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('.theme-toggle')).toBeVisible();

		await page.goto('/anmeldung');
		await expect(page.locator('.theme-toggle')).toBeVisible();
	});
});
