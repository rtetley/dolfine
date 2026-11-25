import { expect, test } from './fixtures';

const SUBMODULES = ['Intervals', 'Chords', 'Voicings', 'Modes', 'Progressions'];

test.describe('ear training', () => {
	test('plays a chord question and grades the answer', async ({ page, samples }) => {
		await page.goto('ear');
		await page
			.getByRole('group', { name: 'Sub-module' })
			.getByRole('button', { name: 'Chords' })
			.click();
		await page.getByRole('combobox', { name: 'Answer' }).selectOption('Choose from options');
		await page.getByRole('button', { name: 'Start' }).click();

		await expect(
			page.getByText('The root sounds first, then the chord. Name its quality.')
		).toBeVisible();
		await expect.poll(() => samples.length).toBeGreaterThan(0);

		await page.locator('.choices button').first().click();
		await page.getByRole('button', { name: 'Check' }).click();
		await expect(page.getByText(/(Right|Not this time)\. It was/)).toBeVisible();
		await page.getByRole('button', { name: 'Next', exact: true }).click();
		await expect(page.getByRole('button', { name: 'Check' })).toBeDisabled();
	});

	for (const submodule of SUBMODULES) {
		test(`${submodule} questions start at levels 1 and 10`, async ({ page }) => {
			await page.goto('ear');
			await page
				.getByRole('group', { name: 'Sub-module' })
				.getByRole('button', { name: submodule })
				.click();
			for (const level of ['Level 1', 'Level 10']) {
				await page.getByRole('combobox', { name: 'Level' }).selectOption(level);
				await page.getByRole('button', { name: 'Start' }).click();
				await expect(
					page.getByRole('button', { name: /^(Check|Replay|Play)/ }).first()
				).toBeVisible();
				await page
					.getByRole('group', { name: 'Sub-module' })
					.getByRole('button', { name: submodule })
					.click();
			}
		});
	}
});
