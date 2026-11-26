import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';

const basePath = (value: string | undefined): '' | `/${string}` =>
	value?.startsWith('/') ? `/${value.slice(1)}` : '';

const outDir = process.env.BUILD_DIR ?? 'build';

export default defineConfig({
	plugins: [
		paraglideVitePlugin({ project: './project.inlang' }),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter({ pages: outDir, assets: outDir }),
			paths: { base: basePath(process.env.BASE_PATH) }
		})
	],
	test: {
		expect: { requireAssertions: true },
		coverage: {
			provider: 'v8',
			include: ['src/**/*.{ts,svelte}'],
			exclude: [
				'src/**/*.test.ts',
				'src/app.d.ts',
				'src/lib/state/testStorage.ts',
				'src/lib/audio/voice/testSignals.ts',
				'src/lib/audio/voice/capture.worklet.ts',
				'src/lib/paraglide/**',
				'src/routes/**'
			],
			thresholds: { statements: 60, lines: 60, functions: 58 }
		},
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'unit',
					environment: 'node',
					include: ['src/**/*.test.ts'],
					exclude: ['src/**/*.svelte.test.ts']
				}
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'component',
					include: ['src/**/*.svelte.test.ts'],
					browser: {
						enabled: true,
						provider: playwright(),
						headless: true,
						instances: [{ browser: 'chromium' }]
					}
				}
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'build',
					environment: 'node',
					include: ['tests/build/**/*.test.ts'],
					globalSetup: ['tests/build/global-setup.ts'],
					testTimeout: 30_000
				}
			}
		]
	}
});
