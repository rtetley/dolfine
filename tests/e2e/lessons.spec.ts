import { expect, seedStorage, test } from './fixtures';

/** Every level open, so the lessons after the first can be read. */
const allOpen = { settings: { levelLadder: 'open' } };

test.describe('theory lessons', () => {
	test('the theory module leads to six lessons', async ({ page }) => {
		await page.goto('theory');
		await page.getByRole('link', { name: 'Theory lessons →' }).click();
		await expect(page).toHaveTitle('Theory lessons · D.O.lfine');
		const lessons = page.getByRole('listitem');
		await expect(lessons).toHaveCount(6);
		await expect(lessons.first()).toContainText('Harmonising the major scale');
		await expect(lessons.nth(1)).toContainText('Chords and modes: twelve colours');
		await expect(lessons.nth(2)).toContainText('Four more colours');
		await expect(page.getByRole('link', { name: /Music theory/ }).first()).toHaveAttribute(
			'aria-current',
			'page'
		);
	});

	test('lessons open one by one, with the level that teaches them', async ({ page }) => {
		await page.goto('theory/lessons');
		const lessons = page.getByRole('listitem');
		await expect(lessons.nth(0)).toContainText('Level 1 · open the lesson');
		await expect(lessons.nth(1)).toContainText('Opens after Level 1');
		await lessons.nth(1).getByRole('link').click();
		await expect(page.getByRole('status')).toContainText('This lesson isn’t open yet.');
		await expect(page.getByRole('heading', { level: 3 })).toHaveCount(0);
	});

	test('a lesson takes the page, with its outline and a way back', async ({ page }) => {
		await page.goto('theory/lessons/major');
		await expect(page.getByRole('navigation', { name: 'Main' })).toHaveCount(0);
		await expect(page.getByRole('link', { name: '← All lessons' })).toBeVisible();
		const outline = page.getByRole('navigation', { name: 'In this lesson' });
		await expect(outline.getByRole('link')).toHaveText([
			'The scale harmonized',
			'Its seven modes',
			'Going further',
			'Practise it'
		]);
		await outline.getByRole('link', { name: 'Going further' }).click();
		await expect(page.getByText(/the grip of the key/)).toBeInViewport();
		await page.getByRole('button', { name: /Name the mode/ }).click();
		await expect(page).toHaveTitle('Music theory · D.O.lfine');
		await expect(page.getByRole('button', { name: 'Back to the levels' })).toBeVisible();
	});

	test('the major-scale lesson walks through seven modes in any key', async ({ page, samples }) => {
		await page.goto('theory/lessons/major');
		await expect(page.getByRole('heading', { name: 'Harmonising the major scale' })).toBeVisible();
		await expect(page.getByRole('heading', { level: 3 })).toHaveText([
			'C Ionian',
			'D Dorian',
			'E Phrygian',
			'F Lydian',
			'G Mixolydian',
			'A Aeolian',
			'B Locrian'
		]);
		// The scale, the seven chords harmonized, and each mode's scale, close and drop 2 voicings.
		await expect(page.locator('figure.score svg')).toHaveCount(23);
		await expect(page.getByRole('button', { name: 'Hear D-7' })).toBeVisible();

		await page.getByRole('combobox', { name: 'Root' }).selectOption('E♭');
		await expect(
			page.getByRole('heading', { name: /The scale harmonized · E♭ major/ })
		).toBeVisible();
		await expect(page.getByRole('heading', { level: 3 }).nth(4)).toHaveText('B♭ Mixolydian');

		await page.getByRole('button', { name: 'Hear Drop 2' }).first().click();
		await expect.poll(() => samples.length).toBeGreaterThan(0);
	});

	test('a mode links to the voicings of its chord', async ({ page }) => {
		await seedStorage(page, allOpen);
		await page.goto('theory/lessons/harmonic-minor');
		await page.getByRole('combobox', { name: 'Root' }).selectOption('A');
		await page.getByRole('link', { name: 'See its voicings →' }).nth(4).click();
		await expect(page).toHaveTitle('Chord voicings · D.O.lfine');
		await expect(page.getByRole('heading', { name: 'E7(♭9 ♭13)' })).toBeVisible();
		await expect(page.getByRole('combobox', { name: 'Parent scale' })).toHaveValue('harmonicMinor');
		await expect(page.getByRole('combobox', { name: 'Degree' })).toHaveValue('5');
	});

	test('the voicings lesson shows and plays eight voicings', async ({ page, samples }) => {
		await seedStorage(page, allOpen);
		await page.goto('theory/lessons/voicings');
		await expect(page.getByRole('heading', { name: 'D-7' })).toBeVisible();
		await expect(page.getByRole('button', { name: /^Hear · / })).toHaveCount(8);
		await expect(page.locator('.voicings .name').first()).toContainText('Close position');
		await expect(page.getByText('1 ♭3 5 ♭7', { exact: true })).toBeVisible();

		await page.getByRole('combobox', { name: 'Degree' }).selectOption({ index: 4 });
		await expect(page.getByRole('heading', { name: 'G7' })).toBeVisible();
		await page.getByRole('button', { name: 'Hear them all' }).click();
		await expect.poll(() => samples.length).toBeGreaterThan(0);
	});

	test('the colour lessons voice each colour two ways, beside its nearest neighbour', async ({
		page,
		samples
	}) => {
		await seedStorage(page, allOpen);
		await page.goto('theory/lessons/chord-colours');
		await expect(page.getByRole('heading', { level: 3 })).toHaveCount(12);
		await expect(page.getByRole('heading', { level: 3 }).first()).toHaveText('CΔ9');
		await expect(page.getByText('1 7 / 3 5 9').first()).toBeVisible();
		await expect(page.getByText(/James Bond theme/)).toBeVisible();
		await page.getByRole('combobox', { name: 'Key' }).selectOption('E♭');
		await expect(page.getByRole('heading', { level: 3 }).first()).toHaveText('E♭Δ9');
		await page.getByRole('button', { name: 'Compare with E♭6/9' }).click();
		await expect.poll(() => samples.length).toBeGreaterThan(0);

		await page.goto('theory/lessons/four-colours');
		await expect(page.getByRole('heading', { level: 3 })).toHaveText([
			'C-11',
			'C7sus4(♭9)',
			'CΔ9(♯11)',
			'C-7(♭13)'
		]);
		await page.getByRole('button', { name: 'Train your ear on the colours →' }).click();
		await expect(page.getByText(/Level \d+ · Chord colours/)).toBeVisible();
	});

	test('unknown lessons are not served', async ({ page, errors }) => {
		const response = await page.goto('theory/lessons/blues');
		expect(response?.status()).toBe(404);
		errors.splice(0);
	});
});

test.describe('lessons in French', () => {
	test.use({ locale: 'fr-FR' });

	test('use French names and solfège', async ({ page }) => {
		await seedStorage(page, allOpen);
		await page.goto('theory/lessons/melodic-minor');
		await expect(
			page.getByRole('heading', { name: 'Harmoniser la gamme mineure mélodique' })
		).toBeVisible();
		await expect(page.getByRole('heading', { level: 3 }).last()).toHaveText('Si altéré');
		await expect(page.getByText('Notes caractéristiques').first()).toBeVisible();
	});
});
