import AxeBuilder from '@axe-core/playwright';
import { drillButton, expect, startDrill, test } from './fixtures';

test.describe('onboarding', () => {
	test.use({ onboarded: false });

	test('a first visit offers a tour that walks through the app', async ({ page }) => {
		await page.goto('');
		const tour = page.getByRole('dialog', { name: 'Welcome to D.O.lfine' });
		await expect(tour).toBeVisible();
		await expect(tour).toContainText('Tour · 1 of 6');

		await tour.getByRole('button', { name: 'Take the tour' }).click();
		await expect(page.getByRole('dialog', { name: 'Four modules' })).toBeVisible();
		await expect(page.locator('[data-tour="modules"]')).toHaveClass(/tour-target/);

		await page.getByRole('button', { name: 'Next' }).click();
		await expect(page.getByRole('dialog', { name: 'Levels you earn' })).toBeVisible();
		await expect(page.locator('[data-tour="nav-progress"]')).toHaveClass(/tour-target/);
		await expect(page.locator('[data-tour="modules"]')).not.toHaveClass(/tour-target/);

		await page.getByRole('button', { name: 'Back' }).click();
		await expect(page.getByRole('dialog', { name: 'Four modules' })).toBeVisible();
		for (let i = 0; i < 4; i++) await page.getByRole('button', { name: 'Next' }).click();
		const last = page.getByRole('dialog', { name: 'Where to begin' });
		await expect(last.getByRole('button', { name: 'Skip the tour' })).toBeHidden();
		await last.getByRole('button', { name: 'Begin practising' }).click();
		await expect(page.getByRole('dialog')).toBeHidden();

		await page.reload();
		await expect(page.getByRole('heading', { name: 'Modules' })).toBeVisible();
		await expect(page.getByRole('dialog')).toBeHidden();
	});

	test('the tour can be skipped, with Escape too, and taken again from Settings', async ({
		page
	}) => {
		await page.goto('');
		await page.getByRole('button', { name: 'Skip the tour' }).click();
		await expect(page.getByRole('dialog')).toBeHidden();

		await page.goto('settings');
		await page.getByRole('button', { name: 'Take the tour again' }).click();
		await expect(page).toHaveTitle('Dashboard · D.O.lfine');
		await expect(page.getByRole('dialog', { name: 'Welcome to D.O.lfine' })).toBeVisible();
		await page.keyboard.press('Escape');
		await expect(page.getByRole('dialog')).toBeHidden();
	});

	test('the tour is accessible', async ({ page }) => {
		await page.goto('');
		await page.getByRole('button', { name: 'Take the tour' }).click();
		const results = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
			.analyze();
		expect(
			results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
		).toEqual([]);
	});

	test('music theory introduces itself and its lessons on the first visit', async ({ page }) => {
		await page.goto('theory');
		const intro = page.getByRole('region', { name: 'Getting started with music theory' });
		await expect(intro).toBeVisible();
		await expect(intro.getByRole('listitem')).toHaveCount(8); // four steps, four lessons
		await expect(intro).toContainText('Get 18 of your last 20 answers right');

		await intro.getByRole('link', { name: /Harmonising the major scale/ }).click();
		await expect(page).toHaveTitle(/Harmonising the major scale/);
		await page.goBack();

		await page
			.getByRole('region', { name: 'Getting started with music theory' })
			.getByRole('button', { name: 'Got it, hide this' })
			.click();
		await expect(intro).toBeHidden();
		await page.reload();
		await expect(intro).toBeHidden();

		await page.getByRole('button', { name: 'Show the introduction to this module' }).click();
		await expect(intro).toBeVisible();
	});

	test('a student can start higher than Level 1', async ({ page }) => {
		await page.goto('theory');
		const intro = page.getByRole('region', { name: 'Getting started with music theory' });
		await intro.getByRole('combobox', { name: /Start at/ }).selectOption({ value: '4' });
		await intro.getByRole('button', { name: 'Use this level' }).click();
		await expect(intro.getByRole('status')).toHaveText('Levels 1 to 4 are open.');
		await expect(drillButton(page, 4, 'Name the mode')).toBeEnabled();
		await expect(drillButton(page, 5, 'Name the chord')).toBeDisabled();
	});

	test('ear training places its ladder and points at the theory behind it', async ({ page }) => {
		await page.goto('ear');
		const intro = page.getByRole('region', { name: 'Getting started with ear training' });
		await expect(intro).toBeVisible();
		await intro.getByRole('combobox', { name: /Start at/ }).selectOption({ value: '3' });
		await intro.getByRole('button', { name: 'Use this level' }).click();

		await expect(drillButton(page, 3, 'Voicings')).toBeEnabled();
		await expect(drillButton(page, 4, 'Modes')).toBeDisabled();

		await startDrill(page, 3, 'Chords');
		const related = page.getByRole('navigation', { name: 'The theory behind this' });
		await expect(related.getByRole('link')).toHaveText([
			'Chord voicings',
			'Harmonising the major scale'
		]);
		await page.getByRole('button', { name: 'Back to the levels' }).click();

		await startDrill(page, 3, 'Intervals');
		await expect(related).toBeHidden();
		await page.getByRole('button', { name: 'Back to the levels' }).click();

		await startDrill(page, 3, 'Voicings');
		await related.getByRole('link', { name: 'Chord voicings' }).click();
		await expect(page).toHaveTitle(/Chord voicings/);
	});

	test('ungraded modules explain how to move up and link to their neighbour', async ({ page }) => {
		await page.goto('rhythm');
		const intro = page.getByRole('region', { name: 'Getting started with inner rhythm' });
		await expect(intro).toContainText('This module isn’t graded yet');
		await expect(intro.getByRole('combobox')).toHaveCount(0);
		await intro.getByRole('link', { name: 'Sight reading →' }).click();
		await expect(
			page.getByRole('region', { name: 'Getting started with sight reading' })
		).toBeVisible();
	});

	test('sight reading explains its ladder and lets the student place themself', async ({
		page
	}) => {
		await page.goto('sight-reading');
		const intro = page.getByRole('region', { name: 'Getting started with sight reading' });
		await expect(intro).toContainText('4 passing runs among your last 5');
		await expect(intro.getByRole('combobox')).toHaveCount(1);
	});

	test('Settings can bring the module introductions back', async ({ page }) => {
		await page.goto('rhythm');
		await page.getByRole('button', { name: 'Got it, hide this' }).click();
		await page.goto('settings');
		await page.getByRole('button', { name: 'Show module introductions again' }).click();
		await expect(page.getByRole('status')).toHaveText('Each module will introduce itself again.');
		await page.goto('rhythm');
		await expect(
			page.getByRole('region', { name: 'Getting started with inner rhythm' })
		).toBeVisible();
	});
});
