import { expect, startDrill, test } from './fixtures';

test.describe('audio', () => {
	test('the first click still plays when the audio library arrives late', async ({
		page,
		samples
	}) => {
		const audioLibrary: string[] = [];
		await page.route('**/_app/immutable/chunks/*.js', async (route) => {
			const response = await route.fetch();
			const body = await response.text();
			if (body.includes('Tone.js')) {
				audioLibrary.push(route.request().url());
				await new Promise((resolve) => setTimeout(resolve, 2000));
			}
			await route.fulfill({ response, body });
		});

		await page.goto('ear');
		await startDrill(page, 1, 'Chords');

		await expect.poll(() => audioLibrary.length).toBe(1);
		await expect.poll(() => samples.length, { timeout: 10_000 }).toBeGreaterThan(0);
		await page.getByRole('button', { name: 'Replay' }).click();
	});

	test('pages without sound never load the audio library', async ({ page }) => {
		const audioLibrary: string[] = [];
		page.on('response', async (response) => {
			if (response.url().includes('/_app/immutable/chunks/')) {
				const body = await response.text().catch(() => '');
				if (body.includes('Tone.js')) audioLibrary.push(response.url());
			}
		});
		await page.goto('');
		await page
			.getByRole('navigation', { name: 'Main' })
			.getByRole('link', { name: 'Settings' })
			.click();
		await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
		await page.waitForTimeout(1500);
		expect(audioLibrary).toEqual([]);
	});
});
