import { expect, installFakeMidi, seedStorage, test } from './fixtures';

const QUICK_RUN = { mode: 'performance', bars: 1, tempo: 240, previewSeconds: 5, level: 1 };

test.describe('sight reading', () => {
	test('practice mode shows a fresh exercise and keeps time on demand', async ({ page }) => {
		await page.goto('sight-reading');
		await page
			.getByRole('combobox', { name: 'Mode', exact: true })
			.selectOption('Practice · untimed');
		await page.getByRole('button', { name: 'Start' }).click();

		const score = page.locator('figure.score svg').first();
		await expect(score).toBeVisible();
		const first = await score.innerHTML();

		const metronome = page.getByRole('button', { name: 'Start metronome' });
		await metronome.click();
		await expect(page.getByRole('button', { name: 'Stop metronome' })).toHaveAttribute(
			'aria-pressed',
			'true'
		);
		await page.getByRole('button', { name: 'Stop metronome' }).click();

		await page.getByRole('button', { name: 'New exercise' }).click();
		await expect.poll(() => score.innerHTML()).not.toBe(first);
	});

	test('a timed run without MIDI ends on an unscored result', async ({ page }) => {
		await seedStorage(page, { 'prefs:sight-reading': QUICK_RUN });
		await page.goto('sight-reading');
		await page.getByRole('button', { name: 'Start' }).click();
		await expect(page.getByText(/Preview · \d+s/)).toBeVisible();
		await page.getByRole('button', { name: 'Start now' }).click();

		await expect(page.getByText(/this run was not scored/)).toBeVisible({ timeout: 15_000 });
		await page.getByRole('button', { name: 'Back to setup' }).click();
		await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
	});

	test('a timed run with a MIDI keyboard is scored', async ({ page }) => {
		await installFakeMidi(page);
		await seedStorage(page, { 'prefs:sight-reading': QUICK_RUN });
		await page.goto('sight-reading');
		await page.getByRole('button', { name: 'Connect MIDI keyboard' }).click();
		await expect(page.getByText('MIDI ready · E2E Keyboard')).toBeVisible();

		await page.getByRole('button', { name: 'Start' }).click();
		await page.getByRole('button', { name: 'Start now' }).click();
		await expect(page.getByText('pitch accuracy')).toBeVisible({ timeout: 15_000 });
		await expect(
			page.getByRole('figure', { name: 'Exercise with results' }).locator('svg')
		).toBeVisible();
	});

	test('stopping a run returns to the setup', async ({ page }) => {
		await seedStorage(page, { 'prefs:sight-reading': QUICK_RUN });
		await page.goto('sight-reading');
		await page.getByRole('button', { name: 'Start' }).click();
		await page.getByRole('button', { name: 'Stop' }).click();
		await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
	});
});
