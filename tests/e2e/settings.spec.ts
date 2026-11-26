import { expect, startDrill, test } from './fixtures';

test.describe('settings', () => {
	test('switches the theme and keeps it after a reload', async ({ page }) => {
		await page.goto('settings');
		const html = page.locator('html');
		await expect(html).not.toHaveAttribute('data-theme');

		await page.getByRole('combobox', { name: 'Theme' }).selectOption('Evening');
		await expect(html).toHaveAttribute('data-theme', 'dark');

		await page.reload();
		await expect(html).toHaveAttribute('data-theme', 'dark');
		await expect(page.getByRole('combobox', { name: 'Theme' })).toHaveValue('dark');

		await page.getByRole('combobox', { name: 'Theme' }).selectOption('Follow the system');
		await expect(html).not.toHaveAttribute('data-theme');
	});

	test('applies note names across modules', async ({ page }) => {
		await page.goto('settings');
		await page.getByRole('combobox', { name: 'Note names' }).selectOption('Do Ré Mi');
		await page
			.getByRole('navigation', { name: 'Main' })
			.getByRole('link', { name: 'Music theory' })
			.click();
		await startDrill(page, 1, 'Name the mode');
		const roots = page.getByRole('group', { name: 'Parent scale' }).getByRole('combobox').first();
		await expect(roots.getByRole('option', { name: 'Do', exact: true })).toHaveCount(1);
	});
});
