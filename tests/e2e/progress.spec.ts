import { expect, seedStorage, test } from './fixtures';

const NAME_THE_CHORD = { exercise: 'name-chord', answerFormat: 'choice', level: 1 };

test.describe('progress', () => {
	test('a new student starts on Level 1 with the rest of the ladder locked', async ({ page }) => {
		await page.goto('theory');
		const level = page.getByRole('combobox', { name: 'Level' });
		await expect(level).toHaveValue('1');
		await expect(page.getByRole('option', { name: 'Level 2 · locked' })).toBeDisabled();
		const panel = page.getByRole('region', { name: 'Your progress' });
		await expect(panel).toContainText('Levels 1 to 1 are open');
		await expect(panel.getByRole('progressbar', { name: 'Progress at Level 1' })).toHaveAttribute(
			'aria-valuenow',
			'0'
		);
	});

	test('answering records XP and an achievement, shown on the progress page', async ({ page }) => {
		await seedStorage(page, { 'prefs:theory': NAME_THE_CHORD });
		await page.goto('theory');
		await page.getByRole('button', { name: 'Start' }).click();
		await page.locator('.choices button').first().click();
		await page.getByRole('button', { name: 'Check' }).click();

		await expect(page.getByText(/^\+\d+ XP$/)).toBeVisible();
		await expect(page.getByText('First note')).toBeVisible();

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

	test('passing a level opens the next one and offers to move up', async ({ page }) => {
		// 18 right answers in the window already: the next answer, right or wrong, keeps 18 of the last 20.
		await seedStorage(page, {
			'prefs:theory': NAME_THE_CHORD,
			progress: {
				tracks: {
					theory: {
						unlocked: 1,
						levels: { 1: { recent: Array(18).fill(true), answered: 18, correct: 18 } }
					}
				}
			}
		});
		await page.goto('theory');
		await page.getByRole('button', { name: 'Start' }).click();
		await page.locator('.choices button').first().click();
		await page.getByRole('button', { name: 'Check' }).click();

		await expect(page.getByText('Level 2 is now open.')).toBeVisible();
		await page.getByRole('button', { name: 'Move up to Level 2' }).click();
		await expect(page.getByText('Level 2 · Name the chord')).toBeVisible();

		await page.getByRole('button', { name: 'Back to setup' }).click();
		await expect(page.getByRole('combobox', { name: 'Level' })).toHaveValue('2');
		await expect(page.getByRole('option', { name: 'Level 3 · locked' })).toBeDisabled();
	});

	test('each ear-training sub-module climbs its own ladder', async ({ page }) => {
		await seedStorage(page, {
			progress: { tracks: { 'ear:modes': { unlocked: 3, levels: {} } } }
		});
		await page.goto('ear');
		const tabs = page.getByRole('group', { name: 'Sub-module' });
		await tabs.getByRole('button', { name: 'Modes' }).click();
		await expect(page.getByRole('combobox', { name: 'Level' })).toHaveValue('3');
		await tabs.getByRole('button', { name: 'Intervals' }).click();
		await expect(page.getByRole('combobox', { name: 'Level' })).toHaveValue('1');

		await page.goto('progress');
		const ladder = page.getByRole('list', { name: 'Modes levels' });
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
		await page.getByRole('combobox', { name: 'Level' }).selectOption('Level 10');
		await expect(page.getByText('Every level is open in Settings')).toBeVisible();

		await page.goto('progress');
		await expect(page.getByRole('group', { name: 'Totals' })).toContainText('0XP');
	});
});
