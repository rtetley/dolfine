import { expect, test } from './fixtures';

const PAGES = [
	{ path: '', nav: 'Dashboard', title: 'Dashboard · D.O.lfine', heading: 'Modules' },
	{
		path: 'sight-reading',
		nav: 'Sight reading',
		title: 'Sight reading · D.O.lfine',
		heading: 'Sight reading'
	},
	{
		path: 'rhythm',
		nav: 'Inner rhythm',
		title: 'Inner rhythm · D.O.lfine',
		heading: 'Inner rhythm'
	},
	{
		path: 'theory',
		nav: 'Music theory',
		title: 'Music theory · D.O.lfine',
		heading: 'Music theory'
	},
	{ path: 'ear', nav: 'Ear training', title: 'Ear training · D.O.lfine', heading: 'Ear training' },
	{ path: 'progress', nav: 'Progress', title: 'Progress · D.O.lfine', heading: 'Progress' },
	{ path: 'settings', nav: 'Settings', title: 'Settings · D.O.lfine', heading: 'Settings' }
] as const;

test.describe('every page @smoke', () => {
	for (const { path, title, heading } of PAGES) {
		test(`/${path} loads directly`, async ({ page }) => {
			await page.goto(path);
			await expect(page).toHaveTitle(title);
			await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
		});
	}

	test('the main navigation reaches every page and marks the current one', async ({ page }) => {
		await page.goto('');
		const nav = page.getByRole('navigation', { name: 'Main' });
		for (const { nav: label, title } of PAGES) {
			await nav.getByRole('link', { name: label }).click();
			await expect(page).toHaveTitle(title);
			await expect(nav.getByRole('link', { name: label })).toHaveAttribute('aria-current', 'page');
		}
		await page.getByRole('link', { name: 'D.O.lfine home' }).click();
		await expect(page).toHaveTitle('Dashboard · D.O.lfine');
	});

	test('the dashboard opens each module', async ({ page }) => {
		await page.goto('');
		const modules = page.getByRole('region', { name: 'Modules' });
		await expect(modules.getByRole('link')).toHaveCount(4);
		await modules.getByRole('link', { name: /Music theory/ }).click();
		await expect(page).toHaveTitle('Music theory · D.O.lfine');
	});

	test('unknown pages are not served', async ({ page, errors }) => {
		const response = await page.goto('no-such-page');
		expect(response?.status()).toBe(404);
		errors.splice(0);
	});
});
