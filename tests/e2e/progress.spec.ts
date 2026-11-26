import type { Page } from '@playwright/test';
import { drillButton, expect, levelSection, seedStorage, startDrill, test } from './fixtures';

const graded = { recent: Array(18).fill(true), answered: 18, correct: 18 };

async function answerNameTheMode(page: Page): Promise<void> {
	await page.locator('.choices button').first().click();
	const parent = page.getByRole('group', { name: 'Parent scale' }).getByRole('combobox');
	await parent.nth(0).selectOption({ index: 1 });
	await parent.nth(1).selectOption({ index: 1 });
	await page.getByRole('button', { name: 'Check' }).click();
}

test.describe('progress', () => {
	test('a new student starts on Level 1 with the rest of the ladder locked', async ({ page }) => {
		await page.goto('theory');
		await expect(drillButton(page, 1, 'Name the mode')).toBeEnabled();
		await expect(drillButton(page, 2, 'Name the chord')).toBeDisabled();
		const panel = page.getByRole('region', { name: 'Your progress' });
		await expect(panel).toContainText('Level 1 is open');
		await expect(panel.getByRole('progressbar', { name: 'Progress at Level 1' })).toHaveAttribute(
			'aria-valuenow',
			'0'
		);
	});

	test('answering records XP and an achievement, shown on the progress page', async ({ page }) => {
		await page.goto('theory');
		await startDrill(page, 1, 'Name the mode');
		await answerNameTheMode(page);

		await expect(page.getByText(/^\+\d+ XP$/)).toBeVisible();
		await expect(page.getByText('First note')).toBeVisible();
		await expect(
			page.getByRole('progressbar', { name: 'Progress on Name the mode' })
		).toBeVisible();

		await page
			.getByRole('navigation', { name: 'Main' })
			.getByRole('link', { name: 'Progress' })
			.click();
		await expect(page).toHaveTitle('Progress · D.O.lfine');
		await expect(page.getByRole('heading', { name: 'Achievements · 1 of 14' })).toBeVisible();
		const totals = page.getByRole('group', { name: 'Totals' });
		await expect(totals).toContainText('XP');
		await expect(page.getByText(/Earned /)).toHaveCount(1);
	});

	test('grading every exercise of a level opens the next one and offers to move up', async ({
		page
	}) => {
		// Every other exercise of Level 1 is graded, and this one has 18 right answers in its window:
		// the next answer, right or wrong, keeps 18 of the last 20.
		await seedStorage(page, {
			progress: {
				tracks: {
					theory: {
						unlocked: 1,
						levels: {
							1: {
								answered: 36,
								correct: 36,
								drills: { 'name-mode': graded, 'write-mode': graded }
							}
						}
					}
				}
			}
		});
		await page.goto('theory');
		await expect(drillButton(page, 1, 'Write the mode')).toHaveAccessibleName(
			'Write the mode · graded'
		);
		await startDrill(page, 1, 'Name the mode');
		await answerNameTheMode(page);

		await expect(page.getByText('Level 2 is now open.')).toBeVisible();
		await page.getByRole('button', { name: 'Move up to Level 2' }).click();
		await expect(page.getByText('Level 2 · Name the chord')).toBeVisible();

		await page.getByRole('button', { name: 'Back to the levels' }).click();
		await expect(drillButton(page, 2, 'Name the chord')).toBeEnabled();
		await expect(levelSection(page, 3).getByText('Locked', { exact: true })).toBeVisible();
	});

	test('ear training climbs one ladder that mixes its sub-modules', async ({ page }) => {
		await seedStorage(page, { progress: { tracks: { ear: { unlocked: 3, levels: {} } } } });
		await page.goto('ear');
		await expect(drillButton(page, 3, 'Voicings')).toBeEnabled();
		await expect(drillButton(page, 2, 'Modes')).toHaveAccessibleName('Modes · graded');
		await expect(drillButton(page, 4, 'Progressions')).toBeDisabled();

		await page.goto('progress');
		const ladder = page.getByRole('list', { name: 'Ear training levels' });
		await expect(ladder.getByText('Level 2: passed')).toBeAttached();
		await expect(ladder.getByText('Level 3: current, 0% of the way')).toBeAttached();
		await expect(ladder.getByText('Level 4: locked')).toBeAttached();
	});

	test('settings can open every level and erase progress', async ({ page }) => {
		await seedStorage(page, {
			progress: { xp: 40, tracks: { theory: { unlocked: 3, levels: {} } } }
		});
		await page.goto('settings');
		await page.getByRole('combobox', { name: 'Levels' }).selectOption('All open');
		await page.getByRole('button', { name: 'Reset progress' }).click();
		await page.getByRole('button', { name: 'Keep them' }).click();
		await page.getByRole('button', { name: 'Reset progress' }).click();
		await page.getByRole('button', { name: 'Erase' }).click();
		await expect(page.getByRole('status')).toHaveText('Progress erased.');

		await page.goto('theory');
		await expect(drillButton(page, 10, 'Voice the chord')).toBeEnabled();
		await expect(page.getByText('Every level is open in Settings')).toBeVisible();

		await page.goto('progress');
		await expect(page.getByRole('group', { name: 'Totals' })).toContainText('0XP');
	});
});
