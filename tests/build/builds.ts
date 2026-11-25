import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

export const BUILDS_ROOT = resolve(import.meta.dirname, '../../.test-builds');
export const BASE_PATH = '/dolfine';

export const BUILDS = {
	root: { dir: join(BUILDS_ROOT, 'root'), basePath: '' },
	pages: { dir: join(BUILDS_ROOT, 'pages'), basePath: BASE_PATH }
} as const;

export const ROUTES = [
	'index',
	'settings',
	'sight-reading',
	'rhythm',
	'theory',
	'ear',
	'theory/lessons',
	'theory/lessons/major',
	'theory/lessons/melodic-minor',
	'theory/lessons/harmonic-minor',
	'theory/lessons/voicings'
] as const;

export const read = (file: string): string => readFileSync(file, 'utf8');

export function listFiles(dir: string): string[] {
	return readdirSync(dir, { recursive: true, encoding: 'utf8' })
		.map((entry) => join(dir, entry))
		.filter((file) => statSync(file).isFile());
}

const ATTRIBUTE_URL = /(?:href|src)="([^"]+)"|import\("([^"]+)"\)/g;
const CSS_URL = /url\(([^)]+)\)/g;

export function localReferences(source: string, pattern = ATTRIBUTE_URL): string[] {
	return [...source.matchAll(pattern)]
		.map((match) => (match[1] ?? match[2] ?? '').replace(/^["']|["']$/g, ''))
		.filter((url) => url && !/^(?:[a-z]+:|\/\/|#|data:)/i.test(url));
}

export const cssReferences = (source: string): string[] => localReferences(source, CSS_URL);

export function resolveReference(
	buildDir: string,
	fromFile: string,
	url: string,
	basePath: string
): string {
	const path = url.split(/[?#]/)[0] ?? '';
	if (path.startsWith('/')) {
		const withoutBase = basePath && path.startsWith(basePath) ? path.slice(basePath.length) : path;
		return join(buildDir, withoutBase);
	}
	return resolve(dirname(fromFile), path);
}

export const exists = (file: string): boolean => existsSync(file);
export const relativeTo = (dir: string, file: string): string => relative(dir, file);
