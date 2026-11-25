import { expect, seedStorage, test } from './fixtures';

test.describe('dashboard', () => {
	test('a first visit shows the welcome and every module from Level 1', async ({ page }) => {
		await page.goto('');
		await expect(page.getByRole('heading', { name: 'Your progress' })).toBeHidden();
		const modules = page.getByRole('region', { name: 'Modules' });
		const theory = modules.getByRole('link', { name: /Music theory/ });
		await expect(theory).toContainText('Level 1 · start here');
		await expect(theory.getByRole('img', { name: 'Estimated level: 1' })).toBeVisible();
		await expect(modules.getByRole('link', { name: /Ear training/ })).toContainText(
			'Chords · Level 1 · start here'
		);
		await expect(modules.getByRole('link', { name: /Sight reading/ })).toContainText(
			'Not graded yet'
		);
	});

	test('shows badges, the current level and totals once the student has practised', async ({
		page
	}) => {
		await seedStorage(page, {
			'prefs:ear': { submodule: 'modes' },
			'prefs:sight-reading': { level: 5 },
			progress: {
				xp: 230,
				answered: 30,
				correct: 25,
				days: ['2026-01-01'],
				tracks: {
					theory: {
						unlocked: 3,
						levels: { 3: { recent: Array(9).fill(true), answered: 9, correct: 9 } }
					},
					'ear:modes': { unlocked: 4, levels: {} }
				},
				achievements: { 'first-answer': '2026-01-01' }
			}
		});
		await page.goto('');
		const totals = page.getByRole('region', { name: 'Your progress' });
		await expect(totals).toContainText('230');
		await expect(totals).toContainText('1 of 14');

		const modules = page.getByRole('region', { name: 'Modules' });
		const theory = modules.getByRole('link', { name: /Music theory/ });
		await expect(theory.getByRole('img', { name: 'Estimated level: 3' })).toBeVisible();
		await expect(theory).toContainText('Level 3 · 50% towards Level 4');
		const ear = modules.getByRole('link', { name: /Ear training/ });
		await expect(ear).toContainText('Modes · Level 4 · 0% towards Level 5');
		await expect(modules.getByRole('link', { name: /Sight reading/ })).toContainText(
			'Level 5 · not graded yet'
		);

		await totals.getByRole('link', { name: 'See your progress' }).click();
		await expect(page).toHaveTitle('Progress · D.O.lfine');
	});
});
