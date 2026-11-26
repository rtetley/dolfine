import type { Locator, Page } from '@playwright/test';
import { expect, installFakeMidi, seedStorage, test } from './fixtures';

const QUICK_RUN = { mode: 'performance', bars: 1, tempo: 240, previewSeconds: 5, level: 1 };
const SLOW_RUN = { ...QUICK_RUN, bars: 8, tempo: 60 };

const notes = async (score: Locator): Promise<string> =>
	(
		await score
			.locator('.vf-stavenote')
			.evaluateAll((all) => all.map((n) => n.getBoundingClientRect().x.toFixed(0)))
	).join();

const staff = (page: Page): Locator => page.locator('figure.score').first();

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
		await expect(
			page.getByRole('figure', { name: 'Exercise with results' }).locator('svg')
		).toBeVisible();
		await page.getByRole('button', { name: 'Back to setup' }).click();
		await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
	});

	test('a finished run restarts the same exercise without the preview', async ({ page }) => {
		await seedStorage(page, { 'prefs:sight-reading': QUICK_RUN });
		await page.goto('sight-reading');
		await page.getByRole('button', { name: 'Start' }).click();
		await page.getByRole('button', { name: 'Start now' }).click();
		await expect(page.getByText(/this run was not scored/)).toBeVisible({ timeout: 15_000 });
		const summary = await page.locator('.summary').textContent();

		await page.getByRole('button', { name: 'Restart from the beginning' }).click();
		await expect(page.getByText(/Preview · \d+s/)).toBeHidden();
		await expect(page.getByRole('button', { name: 'Restart', exact: true })).toBeVisible();
		await expect(page.locator('.summary')).toHaveText(summary ?? '');
		await expect(page.getByText(/this run was not scored/)).toBeVisible({ timeout: 15_000 });
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

	test('stopping a run keeps the exercise on screen', async ({ page }) => {
		await seedStorage(page, { 'prefs:sight-reading': SLOW_RUN });
		await page.goto('sight-reading');
		await page.getByRole('button', { name: 'Start' }).click();
		await page.getByRole('button', { name: 'Start now' }).click();
		await expect(page.getByRole('button', { name: 'Restart', exact: true })).toBeVisible();
		const before = await notes(staff(page));

		await page.getByRole('button', { name: 'Stop' }).click();
		await expect(page.getByText(/^Stopped\./)).toBeVisible();
		await expect(staff(page).locator('svg')).toBeVisible();
		await expect.poll(() => notes(staff(page))).toBe(before);
	});

	test('restarting mid-run starts over with a count-in', async ({ page }) => {
		await seedStorage(page, { 'prefs:sight-reading': SLOW_RUN });
		await page.goto('sight-reading');
		await page.getByRole('button', { name: 'Start' }).click();
		await page.getByRole('button', { name: 'Start now' }).click();
		await expect(page.locator('.caption')).toHaveText('count-in');
		await expect(page.locator('.caption')).not.toHaveText('count-in', { timeout: 10_000 });

		await page.getByRole('button', { name: 'Restart', exact: true }).click();
		await expect(page.locator('.caption')).toHaveText('count-in');
		await expect(page.getByText(/Preview · \d+s/)).toBeHidden();
	});

	test('a stopped exercise can be practised, then played at tempo again', async ({ page }) => {
		await seedStorage(page, { 'prefs:sight-reading': SLOW_RUN });
		await page.goto('sight-reading');
		await page.getByRole('button', { name: 'Start' }).click();
		await page.getByRole('button', { name: 'Stop' }).click();
		const summary = await page.locator('.summary').textContent();

		await page.getByRole('button', { name: 'Practise this exercise' }).click();
		await expect(
			page.getByRole('figure', { name: 'Practice exercise' }).locator('svg')
		).toBeVisible();
		await expect(page.locator('.cursor')).toHaveCount(0);
		await expect(page.locator('.summary')).toHaveText(
			(summary ?? '').replace('· Performance', '· Practice')
		);
		await expect(page.getByText('target ♩ = 60')).toBeVisible();

		const tempo = page.getByRole('spinbutton', { name: /Practice tempo/ });
		await page.getByRole('button', { name: 'Start metronome' }).click();
		await tempo.fill('48');
		await tempo.press('Enter');
		await expect(tempo).toBeEnabled();
		await expect(page.getByRole('button', { name: 'Stop metronome' })).toBeVisible();

		await page.getByRole('button', { name: 'Play it at tempo' }).click();
		await expect(page.getByRole('button', { name: 'Restart', exact: true })).toBeVisible();
		await expect(page.locator('.summary')).toHaveText(summary ?? '');
	});

	test('spoken reading asks for the microphone set-up before the first run', async ({ page }) => {
		await page.goto('sight-reading');
		const staffChoice = page.getByRole('combobox', { name: 'Staff' });
		await staffChoice.selectOption('grand');
		await page
			.getByRole('combobox', { name: 'Answer with' })
			.selectOption('Your voice: say the note names');

		await expect(staffChoice.locator('option', { hasText: 'Grand staff' })).toHaveCount(0);
		await expect(staffChoice).toHaveValue('treble');
		const setup = page.getByRole('region', { name: 'Microphone set-up' });
		await expect(setup).toContainText('not how high or low you say it');
		await expect(setup).toContainText('Then seven made-up syllables, once each:');
		await expect(setup.getByRole('button', { name: 'Set up the microphone' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Start' })).toBeDisabled();
		await expect(page.getByRole('button', { name: 'Connect MIDI keyboard' })).toHaveCount(0);
	});

	test('collection mode is announced while on, and can be turned off', async ({ page }) => {
		await seedStorage(page, { 'prefs:sight-reading': { ...QUICK_RUN, input: 'voice' } });
		await page.goto('sight-reading?collect');
		const notice = page.getByRole('status').filter({ hasText: 'Collection mode is on' });
		await expect(notice).toBeVisible();
		await notice.getByRole('button', { name: 'Turn off' }).click();
		await expect(notice).toHaveCount(0);
		await page.goto('sight-reading');
		await expect(page.getByText('Collection mode is on')).toHaveCount(0);
	});

	test('a calibrated voice can start a spoken reading', async ({ page }) => {
		const take = [[[0, 0]]];
		const letters = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
		await seedStorage(page, {
			'prefs:sight-reading': { ...QUICK_RUN, input: 'voice' },
			settings: { noteNames: 'letters' },
			'voice-profile': {
				version: 3,
				decoys: [take[0]],
				names: 'letters',
				rejectDistance: 1,
				offsetMs: Object.fromEntries(letters.map((letter) => [letter, 0])),
				templates: Object.fromEntries(letters.map((letter) => [letter, take]))
			}
		});
		await page.goto('sight-reading');
		await expect(page.getByText('Microphone set up for C D E F G A B.')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Set up again' })).toBeVisible();
		await page.getByRole('button', { name: 'Start' }).click();
		await expect(page.getByText(/Preview · \d+s/)).toBeVisible();
	});
});
