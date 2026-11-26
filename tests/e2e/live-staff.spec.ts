import type { Page } from '@playwright/test';
import {
	expect,
	installFakeMidi,
	openOptions,
	pressKeys,
	seedStorage,
	startDrill,
	test
} from './fixtures';

const LEVEL_OF: Record<string, number> = {
	'Write the mode': 1,
	'Voice the chord': 3,
	'Voice-leading sheet': 7
};

async function start(page: Page, exercise: string, liveRules = true): Promise<void> {
	await installFakeMidi(page);
	await seedStorage(page, { settings: { levelLadder: 'open' } });
	await page.goto('theory');
	if (!liveRules) {
		await openOptions(page);
		await page.getByRole('checkbox', { name: /voicing rule problems/ }).uncheck();
	}
	await page.getByRole('button', { name: 'Connect MIDI keyboard' }).click();
	await startDrill(page, LEVEL_OF[exercise] ?? 1, exercise);
}

const noteheads = (page: Page, label: string) =>
	page.getByRole('figure', { name: label }).locator('.vf-notehead');

test.describe('live staff', () => {
	test('a written scale fills the staff in ascending order', async ({ page }) => {
		await start(page, 'Write the mode');
		const staff = page.getByRole('figure', { name: 'Your scale' });
		await expect(staff.locator('.vf-rest, .vf-stavenote')).toHaveCount(1);
		await expect(page.getByText('Notes appear on the staff as you play them.')).toBeVisible();

		await pressKeys(page, [67, 60, 64]);
		await expect(noteheads(page, 'Your scale')).toHaveCount(3);
		const ys = await noteheads(page, 'Your scale').evaluateAll((heads) =>
			heads.map((head) => head.getBoundingClientRect().y)
		);
		expect(ys).toEqual([...ys].sort((a, b) => b - a));
		await expect(page.getByText('Notes appear on the staff as you play them.')).toBeHidden();
	});

	test('a voiced chord fills the grand staff and flags rule problems', async ({ page }) => {
		await start(page, 'Voice the chord');
		await pressKeys(page, [48, 55, 60, 83]);
		await expect(noteheads(page, 'Your chord')).toHaveCount(4);
		await expect(page.getByText('The right hand goes above A5.')).toBeVisible();

		await pressKeys(page, [83]);
		await expect(page.getByText(/^3 notes selected/)).toBeVisible();
		await expect(page.getByText('The right hand goes above A5.')).toBeHidden();
	});

	test('rule hints can be turned off in the setup', async ({ page }) => {
		await start(page, 'Voice the chord', false);
		await pressKeys(page, [40, 43, 83]);
		await expect(noteheads(page, 'Your chord')).toHaveCount(3);
		await expect(page.locator('.live .bad')).toHaveCount(0);
	});

	test('the chord being written appears in the voice-leading sheet', async ({ page }) => {
		await start(page, 'Voice-leading sheet');
		const heads = page
			.getByRole('figure', { name: 'Your voice-leading sheet' })
			.locator('.vf-notehead');
		await expect(heads.first()).toBeVisible();
		const before = await heads.count();
		await pressKeys(page, [40, 43]);
		await expect.poll(() => heads.count()).toBeGreaterThan(before);
		await expect(
			page.getByText('An interval sits below its low interval limit and will sound muddy.')
		).toBeVisible();
	});
});
