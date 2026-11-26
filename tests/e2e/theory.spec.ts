import { expect, seedStorage, startDrill, test } from './fixtures';

/** Each exercise at the first and the last level that grades it. */
const EXERCISES: readonly [string, readonly number[]][] = [
	['Name the mode', [1, 7]],
	['Write the mode', [1, 9]],
	['Mode in context', [7, 10]],
	['Name the chord', [2, 10]],
	['Build the chord', [2, 9]],
	['Voice the chord', [3, 10]],
	['Voice-leading sheet', [7, 10]]
];

test.describe('music theory', () => {
	test('answers a name-the-mode question end to end', async ({ page }) => {
		await page.goto('theory');
		await startDrill(page, 1, 'Name the mode');

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

	test('shows each level as a section, with locked levels saying what opens them', async ({
		page
	}) => {
		await page.goto('theory');
		await expect(page.getByRole('heading', { name: 'Level 1 The major scale' })).toBeVisible();
		await expect(
			page.getByRole('region', { name: /^Level 1 / }).getByRole('link', {
				name: 'Harmonising the major scale'
			})
		).toBeVisible();
		const second = page.getByRole('region', { name: /^Level 2 / });
		await expect(second.getByText('Locked', { exact: true })).toBeVisible();
		await expect(second).toContainText(
			'To open it, reach 90% on these exercises of Level 1: Name the mode · Write the mode'
		);
		await expect(page.getByRole('region', { name: /^Level 3 / })).toContainText(
			'Opens once Level 2 is passed'
		);
	});

	for (const [exercise, levels] of EXERCISES) {
		test(`“${exercise}” renders at the levels that grade it`, async ({ page }) => {
			await seedStorage(page, { settings: { levelLadder: 'open' } });
			await page.goto('theory');
			for (const level of levels) {
				await startDrill(page, level, exercise);
				await expect(page.getByText(`Level ${level} · ${exercise}`)).toBeVisible();
				await expect(page.locator('.prompt').first()).toBeVisible();
				await expect(
					page.getByRole('button', { name: /^(Check|Write this chord)/ }).first()
				).toBeVisible();
				await page.getByRole('button', { name: 'Back to the levels' }).click();
			}
		});
	}
});
