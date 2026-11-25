import { defineConfig, devices } from '@playwright/test';
import { siteUrl } from './tests/e2e/sites.ts';

const chromium = {
	...devices['Desktop Chrome'],
	launchOptions: { args: ['--autoplay-policy=no-user-gesture-required'] }
};

export default defineConfig({
	testDir: 'tests/e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
	use: {
		baseURL: siteUrl('root'),
		trace: 'retain-on-failure'
	},
	projects: [
		{ name: 'desktop', use: chromium },
		{
			name: 'mobile',
			grep: /@smoke/,
			use: { ...devices['Pixel 7'], launchOptions: chromium.launchOptions }
		},
		{
			name: 'github-pages',
			grep: /@smoke/,
			use: { ...chromium, baseURL: siteUrl('pages') }
		}
	],
	webServer: {
		command: 'node tests/e2e/serve.ts',
		url: siteUrl('pages'),
		reuseExistingServer: !process.env.CI,
		timeout: 120_000
	}
});
