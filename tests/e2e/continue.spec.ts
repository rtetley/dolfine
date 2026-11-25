import { expect, seedStorage, test } from './fixtures';

test('the dashboard offers to continue the last module with its settings', async ({ page }) => {
	await seedStorage(page, { progress: { tracks: { theory: { unlocked: 4, levels: {} } } } });
	await page.goto('');
	await expect(page.getByText(/elcome to D\.O\.lfine/)).toBeVisible();

	await page.goto('theory');
	await page.getByRole('combobox', { name: 'Level' }).selectOption('Level 4');
	await page.getByRole('combobox', { name: 'Exercise' }).selectOption('Name the chord');
	await page.getByRole('button', { name: 'Start' }).click();

	await page.getByRole('link', { name: 'Dashboard' }).click();
	const resume = page.getByRole('link', { name: /Continue/ });
	await expect(resume).toContainText('Music theory · Level 4 · Name the chord');
	await expect(page.getByText(/elcome to D\.O\.lfine/)).toBeHidden();

	await resume.click();
	await expect(page).toHaveTitle('Music theory · D.O.lfine');
	await expect(page.getByRole('combobox', { name: 'Level' })).toHaveValue('4');
	await expect(page.getByRole('combobox', { name: 'Exercise' })).toHaveValue('name-chord');
});
