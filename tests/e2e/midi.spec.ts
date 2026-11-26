import { expect, installFakeMidi, pressKeys, seedStorage, startDrill, test } from './fixtures';

test('a MIDI keyboard writes notes into the theory exercises', async ({ page }) => {
	await installFakeMidi(page);
	await page.goto('theory');
	await page.getByRole('button', { name: 'Connect MIDI keyboard' }).click();
	await expect(page.getByText('MIDI ready · E2E Keyboard')).toBeVisible();
	await startDrill(page, 1, 'Write the mode');

	await expect(page.getByText(/MIDI keys toggle notes too/)).toBeVisible();
	await pressKeys(page, [60, 62, 64]);
	await expect(page.getByText(/^3 notes selected/)).toBeVisible();
	await expect(page.getByRole('button', { name: 'D4', exact: true })).toHaveAttribute(
		'aria-pressed',
		'true'
	);

	await pressKeys(page, [62, 20]);
	await expect(page.getByText(/^2 notes selected/)).toBeVisible();
});

test('a voice-leading sheet can be written from the keyboard and checked', async ({ page }) => {
	await installFakeMidi(page);
	await seedStorage(page, { settings: { levelLadder: 'open' } });
	await page.goto('theory');
	await page.getByRole('button', { name: 'Connect MIDI keyboard' }).click();
	await startDrill(page, 7, 'Voice-leading sheet');

	const write = page.getByRole('button', { name: 'Write this chord' });
	while (await write.isVisible()) {
		await pressKeys(page, [48, 55, 64, 67, 72]);
		await write.click();
	}
	await page.getByRole('button', { name: 'Check the sheet' }).click();
	await expect(page.locator('.violations li, p.good').first()).toBeVisible();

	await page.getByRole('button', { name: 'Show a model answer' }).click();
	await expect(page.getByRole('button', { name: 'Hide a model answer' })).toBeVisible();
	await page.getByRole('button', { name: 'Next sheet' }).click();
	await expect(write).toBeDisabled();
});
