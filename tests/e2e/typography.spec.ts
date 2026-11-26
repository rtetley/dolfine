import { expect, seedStorage, test } from './fixtures';

test.describe('typography', () => {
	test('accidentals come from the bundled music font and sit tight', async ({ page }) => {
		await seedStorage(page, { settings: { levelLadder: 'open' } });
		await page.goto('theory/lessons/melodic-minor');
		await expect(page.getByRole('heading', { name: 'E♭ Lydian augmented' })).toBeVisible();

		const metrics = await page.evaluate(async () => {
			await document.fonts.ready;
			const probe = document.createElement('span');
			probe.style.font = getComputedStyle(document.body).font;
			document.body.append(probe);
			const width = (text: string) => {
				probe.textContent = text;
				return probe.getBoundingClientRect().width;
			};
			const size = parseFloat(getComputedStyle(probe).fontSize);
			const result = {
				loaded: document.fonts.check(`${size}px "Dolfine Accidentals"`, '♭'),
				flat: width('♭') / size,
				sharp: width('♯') / size
			};
			probe.remove();
			return result;
		});

		expect(metrics.loaded).toBe(true);
		expect(metrics.flat).toBeLessThan(0.45);
		expect(metrics.sharp).toBeLessThan(0.45);
	});
});
