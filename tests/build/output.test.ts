import { statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
	BASE_PATH,
	BUILDS,
	cssReferences,
	exists,
	listFiles,
	localReferences,
	read,
	relativeTo,
	resolveReference,
	ROUTES
} from './builds';

const INITIAL_JS_BUDGET_KB: Record<string, number> = {
	'index.html': 230,
	'settings.html': 180,
	'progress.html': 190,
	'sight-reading.html': 282,
	'rhythm.html': 260,
	'theory.html': 305,
	'ear.html': 305,
	'theory/lessons.html': 200,
	'theory/lessons/major.html': 250,
	'theory/lessons/chord-colours.html': 250,
	'theory/lessons/four-colours.html': 250,
	'theory/lessons/melodic-minor.html': 250,
	'theory/lessons/harmonic-minor.html': 250,
	'theory/lessons/voicings.html': 250
};

const LAZY_LIBRARIES = [
	['VexFlow', 'VexFlow'],
	['Tone.js', 'Tone.js']
] as const;

describe.each(Object.entries(BUILDS))('%s build', (_, { dir, basePath }) => {
	const files = listFiles(dir);
	const htmlFiles = files.filter((file) => file.endsWith('.html'));

	it('prerenders a page for every route', () => {
		for (const route of ROUTES) expect(exists(join(dir, `${route}.html`)), route).toBe(true);
	});

	it.each(ROUTES)('%s boots the SvelteKit client', (route) => {
		const html = read(join(dir, `${route}.html`));
		expect(html).toContain('<html lang="en">');
		expect(html).toMatch(/import\("(?:\.\.?\/)+_app\/immutable\/entry\/start\.[\w-]+\.js"\)/);
		expect(html).toContain('kit.start(app, element)');
	});

	it('references only files that exist', () => {
		const missing = htmlFiles.flatMap((file) =>
			localReferences(read(file))
				.map((url) => resolveReference(dir, file, url, basePath))
				.filter((target) => !exists(target))
				.map((target) => `${relativeTo(dir, file)} → ${relativeTo(dir, target)}`)
		);
		const cssMissing = files
			.filter((file) => file.endsWith('.css'))
			.flatMap((file) =>
				cssReferences(read(file))
					.map((url) => resolveReference(dir, file, url, basePath))
					.filter((target) => !exists(target))
					.map((target) => `${relativeTo(dir, file)} → ${relativeTo(dir, target)}`)
			);
		expect([...missing, ...cssMissing]).toEqual([]);
	});

	it('ships the static files and no source maps or tests', () => {
		expect(exists(join(dir, 'robots.txt'))).toBe(true);
		expect(exists(join(dir, '_app/version.json'))).toBe(true);
		const leaked = files.filter((file) => /\.map$|\.test\.|\.spec\./.test(file));
		expect(leaked).toEqual([]);
	});

	it.each(LAZY_LIBRARIES)('keeps %s out of the first load', (_library, marker) => {
		const chunks = files
			.filter((file) => file.endsWith('.js'))
			.filter((file) => read(file).includes(marker))
			.map((file) => relativeTo(dir, file));
		expect(chunks.length).toBeGreaterThan(0);
		for (const file of htmlFiles) {
			const preloaded = localReferences(read(file));
			for (const chunk of chunks) {
				expect(
					preloaded.some((url) => url.endsWith(chunk)),
					`${relativeTo(dir, file)} preloads ${chunk}`
				).toBe(false);
			}
		}
	});

	it("keeps each page's initial JavaScript within budget", () => {
		for (const file of htmlFiles) {
			const budget = INITIAL_JS_BUDGET_KB[relativeTo(dir, file)];
			const bytes = [...new Set(localReferences(read(file)))]
				.filter((url) => url.endsWith('.js'))
				.map((url) => statSync(resolveReference(dir, file, url, basePath)).size)
				.reduce((sum, size) => sum + size, 0);
			expect(budget, `no budget for ${relativeTo(dir, file)}`).toBeDefined();
			expect(bytes / 1024, relativeTo(dir, file)).toBeLessThan(budget ?? 0);
		}
	});
});

describe('GitHub Pages build', () => {
	it('serves assets from the repository sub-path', () => {
		const html = read(join(BUILDS.pages.dir, 'index.html'));
		expect(html).toContain(`assets: "${BASE_PATH}"`);
	});

	it('leaves the root build at the domain root', () => {
		const html = read(join(BUILDS.root.dir, 'index.html'));
		expect(html).not.toContain(BASE_PATH);
	});
});
