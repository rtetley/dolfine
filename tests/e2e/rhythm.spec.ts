import type { Locator } from '@playwright/test';
import { expect, test } from './fixtures';

const notation = async (score: Locator): Promise<string> => (await score.textContent()) ?? '';

test.describe('inner rhythm', () => {
	test('reading shows a score, plays it and offers the next one', async ({ page }) => {
		await page.goto('rhythm');
		await page.getByRole('button', { name: 'Start' }).click();
		const score = page.locator('figure.score svg').first();
		await expect(score).toBeVisible();

		await page.getByRole('button', { name: 'Listen' }).click();
		const first = await notation(score);
		await page.getByRole('button', { name: 'Same exercise again' }).click();
		await expect.poll(() => notation(score)).toBe(first);
		await page.getByRole('button', { name: 'New exercise' }).click();
		await expect.poll(() => notation(score)).not.toBe(first);
	});

	test('polyrhythm draws the cycle and keeps time', async ({ page }) => {
		await page.goto('rhythm');
		await page
			.getByRole('group', { name: 'Sub-module' })
			.getByRole('button', { name: /Polyrhythm/ })
			.click();
		await page.getByRole('button', { name: 'Start' }).click();
		await expect(
			page
				.locator('svg')
				.filter({ has: page.locator('circle') })
				.first()
		).toBeVisible();
	});
});
