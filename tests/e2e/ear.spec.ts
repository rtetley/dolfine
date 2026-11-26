import { expect, seedStorage, startDrill, test } from './fixtures';

/** Each sub-module at the first and the last level that grades it. */
const SUBMODULES: readonly [string, readonly number[]][] = [
	['Intervals', [1, 10]],
	['Chords', [1, 10]],
	['Voicings', [3, 10]],
	['Modes', [2, 10]],
	['Progressions', [4, 10]],
	['Chord colours', [1, 10]]
];

test.describe('ear training', () => {
	test('plays a chord question and grades the answer', async ({ page, samples }) => {
		await page.goto('ear');
		await startDrill(page, 1, 'Chords');

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

	test('chord colours start with Δ9 against 6/9, then grow to all sixteen', async ({ page }) => {
		await seedStorage(page, { settings: { levelLadder: 'open' } });
		await page.goto('ear');
		await startDrill(page, 1, 'Chord colours');
		await expect(page.getByText('Which chord colour is it?')).toBeVisible();
		// The options come shuffled: just these two.
		const choices = page.locator('.choices button');
		await expect(choices).toHaveCount(2);
		await expect(choices.and(page.getByRole('button', { name: 'Δ9', exact: true }))).toHaveCount(1);
		await expect(choices.and(page.getByRole('button', { name: '6/9', exact: true }))).toHaveCount(
			1
		);
		await page.getByRole('button', { name: 'Back to the levels' }).click();
		await startDrill(page, 10, 'Chord colours');
		await expect(page.getByRole('combobox', { name: 'Your answer' }).locator('option')).toHaveCount(
			17
		);
	});

	for (const [submodule, levels] of SUBMODULES) {
		test(`${submodule} questions start at the levels that grade them`, async ({ page }) => {
			await seedStorage(page, { settings: { levelLadder: 'open' } });
			await page.goto('ear');
			for (const level of levels) {
				await startDrill(page, level, submodule);
				await expect(page.getByText(`Level ${level} · ${submodule}`)).toBeVisible();
				await expect(
					page.getByRole('button', { name: /^(Check|Replay|Play)/ }).first()
				).toBeVisible();
				await page.getByRole('button', { name: 'Back to the levels' }).click();
			}
		});
	}

	test('a wrong mode can be heard next to the right one', async ({ page }) => {
		await seedStorage(page, { progress: { tracks: { ear: { unlocked: 2, levels: {} } } } });
		await page.goto('ear');
		await startDrill(page, 2, 'Modes');

		const yours = page.getByRole('button', { name: /^Hear your answer · / });
		for (let attempt = 0; attempt < 12; attempt++) {
			await page.locator('.choices button').first().click();
			await page.getByRole('button', { name: 'Check' }).click();
			if (await yours.isVisible()) break;
			await expect(page.getByRole('button', { name: /^Hear the right answer/ })).toHaveCount(0);
			await page.getByRole('button', { name: 'Next', exact: true }).click();
		}

		await expect(yours).toBeVisible();
		await expect(page.getByRole('button', { name: /^Hear the right answer · / })).toBeVisible();
		await page.getByRole('button', { name: 'Yours, then the right one' }).click();
	});
});
