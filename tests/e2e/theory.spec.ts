import { expect, seedStorage, test } from './fixtures';

const EXERCISES = [
	'Name the mode',
	'Write the mode',
	'Mode in context',
	'Name the chord',
	'Build the chord',
	'Voice the chord',
	'Voice-leading sheet'
];

test.describe('music theory', () => {
	test('answers a name-the-mode question end to end', async ({ page }) => {
		await page.goto('theory');
		await page.getByRole('combobox', { name: 'Exercise' }).selectOption('Name the mode');
		await page.getByRole('combobox', { name: 'Answer format' }).selectOption('Multiple choice');
		await page.getByRole('button', { name: 'Start' }).click();

		await expect(page.getByRole('figure', { name: 'Scale to name' }).locator('svg')).toBeVisible();
		const check = page.getByRole('button', { name: 'Check' });
		await expect(check).toBeDisabled();

		const choices = page
			.getByRole('group')
			.filter({ has: page.getByRole('button', { pressed: false }) })
			.first();
		await choices.getByRole('button').first().click();
		const parent = page.getByRole('group', { name: 'Parent scale' }).getByRole('combobox');
		await parent.nth(0).selectOption({ index: 1 });
		await parent.nth(1).selectOption({ index: 1 });
		await check.click();

		await expect(page.getByText(/Parent scale(?: right)?:/)).toBeVisible();
		await expect(page.locator('.choices button.right')).toHaveCount(1);
		await page.getByRole('button', { name: 'Next question' }).click();
		await expect(page.getByRole('button', { name: 'Check' })).toBeDisabled();
	});

	for (const exercise of EXERCISES) {
		test(`“${exercise}” renders at every level band`, async ({ page }) => {
			await seedStorage(page, { settings: { levelLadder: 'open' } });
			await page.goto('theory');
			await page.getByRole('combobox', { name: 'Exercise' }).selectOption(exercise);
			for (const level of ['Level 1', 'Level 5', 'Level 10']) {
				await page.getByRole('combobox', { name: 'Level' }).selectOption(level);
				await page.getByRole('button', { name: 'Start' }).click();
				await expect(page.getByText(`${level} · ${exercise}`)).toBeVisible();
				await expect(page.locator('.prompt').first()).toBeVisible();
				await expect(
					page.getByRole('button', { name: /^(Check|Write this chord)/ }).first()
				).toBeVisible();
				await page.getByRole('button', { name: 'Back to setup' }).click();
			}
		});
	}
});
