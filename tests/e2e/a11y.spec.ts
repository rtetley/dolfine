import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, startDrill, test } from './fixtures';

async function seriousViolations(page: Page): Promise<string[]> {
	const results = await new AxeBuilder({ page })
		.withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
		.analyze();
	return results.violations
		.filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')
		.map(
			(violation) =>
				`${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(', ')}`
		);
}

test.describe('accessibility', () => {
	for (const path of [
		'',
		'sight-reading',
		'rhythm',
		'theory',
		'ear',
		'settings',
		'progress',
		'theory/lessons',
		'theory/lessons/major',
		'theory/lessons/voicings'
	]) {
		test(`/${path} setup has no serious WCAG violations`, async ({ page }) => {
			await page.goto(path);
			await expect(page.getByRole('heading').first()).toBeVisible();
			expect(await seriousViolations(page)).toEqual([]);
		});
	}

	for (const theme of ['light', 'dark']) {
		test(`a theory question is accessible in the ${theme} theme`, async ({ page }) => {
			await page.goto('theory');
			await page.evaluate(
				(value) => localStorage.setItem('dolfine:settings', JSON.stringify({ theme: value })),
				theme
			);
			await page.reload();
			await startDrill(page, 1, 'Name the mode');
			await expect(page.locator('figure.score svg')).toBeVisible();
			expect(await seriousViolations(page)).toEqual([]);
		});
	}
});
