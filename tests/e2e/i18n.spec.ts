import { expect, test } from './fixtures';

const FRENCH_PAGES = [
	{ path: '', title: 'Tableau de bord · D.O.lfine', heading: 'Modules' },
	{ path: 'sight-reading', title: 'Lecture à vue · D.O.lfine', heading: 'Lecture à vue' },
	{ path: 'rhythm', title: 'Rythme intérieur · D.O.lfine', heading: 'Rythme intérieur' },
	{ path: 'theory', title: 'Théorie musicale · D.O.lfine', heading: 'Théorie musicale' },
	{ path: 'ear', title: 'Formation de l’oreille · D.O.lfine', heading: 'Formation de l’oreille' },
	{ path: 'progress', title: 'Progrès · D.O.lfine', heading: 'Progrès' },
	{ path: 'settings', title: 'Réglages · D.O.lfine', heading: 'Réglages' }
];

test.describe('a French browser', () => {
	test.use({ locale: 'fr-FR' });

	for (const { path, title, heading } of FRENCH_PAGES) {
		test(`/${path} opens in French`, async ({ page }) => {
			await page.goto(path);
			await expect(page).toHaveTitle(title);
			await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
			await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
		});
	}

	test('names notes in solfège and modes in French by default', async ({ page }) => {
		await page.goto('theory');
		await page.getByRole('combobox', { name: 'Exercice' }).selectOption('Écrire le mode');
		await page.getByRole('button', { name: 'Commencer' }).click();
		await expect(page.locator('.prompt strong')).toHaveText(
			/^(Do|Ré|Mi|Fa|Sol|La|Si)[♯♭]? [a-zéèûô♭♯♮ ]+\d?$/
		);
		const root = page.getByRole('combobox', { name: 'Tonique' });
		await expect(root.getByRole('option', { name: 'Do', exact: true })).toHaveCount(1);
	});

	test('keeps an explicit naming choice over the language', async ({ page }) => {
		await page.goto('settings');
		await page.getByRole('combobox', { name: 'Noms des notes' }).selectOption('C D E');
		await page.getByRole('navigation').getByRole('link', { name: 'Théorie musicale' }).click();
		await page.getByRole('button', { name: 'Commencer' }).click();
		const root = page.getByRole('combobox', { name: 'Tonique' });
		await expect(root.getByRole('option', { name: 'C', exact: true })).toHaveCount(1);
	});

	test('runs a theory question with French feedback', async ({ page }) => {
		await page.goto('theory');
		await page.getByRole('combobox', { name: 'Exercice' }).selectOption('Nommer le mode');
		await page.getByRole('combobox', { name: 'Format de réponse' }).selectOption('Choix multiple');
		await page.getByRole('button', { name: 'Commencer' }).click();
		await expect(
			page.getByText('Quel est ce mode, et quelle est sa gamme mère\u202f?')
		).toBeVisible();
		await page.locator('.choices button').first().click();
		await page.getByRole('combobox', { name: 'Tonique' }).selectOption({ index: 1 });
		await page.getByRole('combobox', { name: 'Gamme', exact: true }).selectOption({ index: 1 });
		await page.getByRole('button', { name: 'Vérifier' }).click();
		await expect(page.getByText(/Gamme mère( juste)?\u00a0:/)).toBeVisible();
	});
});

test.describe('the language setting', () => {
	test('switches to French, survives a reload, and switches back', async ({ page }) => {
		await page.goto('settings');
		await expect(page.locator('html')).toHaveAttribute('lang', 'en');

		await page.getByRole('combobox', { name: 'Language' }).selectOption('Français');
		await expect(page.getByRole('heading', { name: 'Réglages' })).toBeVisible();
		await expect(page.locator('html')).toHaveAttribute('lang', 'fr');

		await page.reload();
		await expect(page.getByRole('heading', { name: 'Réglages' })).toBeVisible();

		await page.getByRole('combobox', { name: 'Langue' }).selectOption('English');
		await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
	});

	test('beats the browser language once chosen', async ({ browser }) => {
		const context = await browser.newContext({ locale: 'fr-FR' });
		const page = await context.newPage();
		await page.goto('settings');
		await page.getByRole('combobox', { name: 'Langue' }).selectOption('English');
		await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
		await page.goto('theory');
		await expect(page.getByRole('heading', { name: 'Music theory', exact: true })).toBeVisible();
		await context.close();
	});
});
