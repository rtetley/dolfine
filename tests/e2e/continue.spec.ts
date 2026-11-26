import { drillButton, expect, levelSection, seedStorage, startDrill, test } from './fixtures';

test('the dashboard continues the last exercise with its settings', async ({ page }) => {
	await seedStorage(page, { progress: { tracks: { theory: { unlocked: 4, levels: {} } } } });
	await page.goto('');
	await expect(page.getByText(/elcome to D\.O\.lfine/)).toBeVisible();

	await page.goto('theory');
	await startDrill(page, 4, 'Write the mode');

	await page.getByRole('link', { name: 'Dashboard' }).click();
	const resume = page.getByRole('link', { name: /^Continue/ });
	await expect(resume).toContainText('Music theory · Level 4 · Write the mode');
	await expect(page.getByText(/elcome to D\.O\.lfine/)).toBeHidden();

	await resume.click();
	await expect(page).toHaveTitle('Music theory · D.O.lfine');
	await expect(page.getByText('Level 4 · Write the mode')).toBeVisible();
	await expect(page).toHaveURL(/\/theory$/);

	await page.getByRole('button', { name: 'Back to the levels' }).click();
	await expect(drillButton(page, 4, 'Write the mode')).toBeEnabled();
});

test('Continue can also open the setup first', async ({ page }) => {
	await seedStorage(page, {
		continue: { module: 'ear', summary: 'Ear training · Level 1 · Chords' }
	});
	await page.goto('');
	await page.getByRole('link', { name: 'Or change the settings first' }).click();
	await expect(page).toHaveTitle('Ear training · D.O.lfine');
	await expect(levelSection(page, 1)).toBeVisible();
});

for (const [module, title] of [
	['sight-reading', 'Sight reading'],
	['rhythm', 'Inner rhythm'],
	['ear', 'Ear training']
] as const) {
	test(`Continue resumes ${title} straight into an exercise`, async ({ page }) => {
		await seedStorage(page, {
			continue: { module, summary: `${title} · Level 1` },
			'prefs:sight-reading': { mode: 'practice', level: 1 }
		});
		await page.goto('');
		await page.getByRole('link', { name: /^Continue/ }).click();
		await expect(page).toHaveTitle(`${title} · D.O.lfine`);
		await expect(page.getByRole('button', { name: 'Start', exact: true })).toBeHidden();
	});
}
