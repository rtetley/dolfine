import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(resolve(import.meta.dirname, 'tokens.css'), 'utf8');

type Oklch = [number, number, number];

const declarations = (block: string): Map<string, string> =>
	new Map(
		[...block.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map(([, name, value]) => [name, value.trim()])
	);

const blockAfter = (selector: string): string => {
	const start = css.indexOf(selector);
	const open = css.indexOf('{', start);
	return css.slice(open + 1, css.indexOf('}', open));
};

const light = declarations(blockAfter(':root {'));
const dark = new Map([...light, ...declarations(blockAfter(":root[data-theme='dark']"))]);

function colour(theme: Map<string, string>, token: string): Oklch {
	const value = theme.get(token);
	if (!value) throw new Error(`${token} is not defined`);
	const reference = /^var\((--[\w-]+)\)$/.exec(value);
	if (reference) return colour(theme, reference[1]);
	const match = /^oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)$/.exec(value);
	if (!match) throw new Error(`${token} is not a plain OKLCH colour: ${value}`);
	return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function relativeLuminance([l, c, h]: Oklch): number {
	const a = c * Math.cos((h * Math.PI) / 180);
	const b = c * Math.sin((h * Math.PI) / 180);
	const lms = [
		l + 0.3963377774 * a + 0.2158037573 * b,
		l - 0.1055613458 * a - 0.0638541728 * b,
		l - 0.0894841775 * a - 1.291485548 * b
	].map((x) => x ** 3);
	const [r, g, bl] = [
		4.0767416621 * lms[0] - 3.3077115913 * lms[1] + 0.2309699292 * lms[2],
		-1.2684380046 * lms[0] + 2.6097574011 * lms[1] - 0.3413193965 * lms[2],
		-0.0041960863 * lms[0] - 0.7034186147 * lms[1] + 1.707614701 * lms[2]
	].map((x) => Math.min(Math.max(x, 0), 1));
	return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
}

const contrast = (x: Oklch, y: Oklch): number => {
	const [low, high] = [relativeLuminance(x), relativeLuminance(y)].sort((p, q) => p - q);
	return (high + 0.05) / (low + 0.05);
};

const TEXT = 4.5;
const CONTROL = 3;

const PAIRS: [string, string, number][] = [
	['--ink', '--paper', TEXT],
	['--ink-soft', '--paper', TEXT],
	['--ink-soft', '--paper-deep', TEXT],
	['--ink-faint', '--paper', CONTROL],
	['--accent', '--paper', TEXT],
	['--accent', '--paper-deep', TEXT],
	['--on-ink', '--ink', TEXT],
	['--on-accent', '--accent', TEXT],
	['--good', '--paper', TEXT],
	['--good', '--good-soft', TEXT],
	['--bad', '--paper', TEXT],
	['--bad', '--bad-soft', TEXT],
	['--late', '--paper', TEXT],
	['--early', '--paper', TEXT],
	['--focus', '--paper', CONTROL],
	['--rule-strong', '--paper', CONTROL],
	['--key-edge', '--key-white', CONTROL]
];

describe.each([
	['light', light],
	['dark', dark]
])('%s theme', (_, theme) => {
	it.each(PAIRS)('%s on %s meets %d:1', (foreground, background, minimum) => {
		expect(contrast(colour(theme, foreground), colour(theme, background))).toBeGreaterThanOrEqual(
			minimum
		);
	});
});

describe('palette', () => {
	const ramps = ['sepia', 'oxblood', 'moss', 'vermilion', 'crimson', 'ochre', 'slate'];
	const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

	it.each(ramps)('%s has eleven shades that darken step by step', (ramp) => {
		const lightness = steps.map((step) => colour(light, `--${ramp}-${step}`)[0]);
		expect(lightness).toEqual([...lightness].sort((p, q) => q - p));
	});
});

describe('dark theme', () => {
	it('is the same whether the system or the theme setting asks for it', () => {
		const system = declarations(blockAfter(":root:not([data-theme='light'])"));
		const chosen = declarations(blockAfter(":root[data-theme='dark']"));
		expect(Object.fromEntries(system)).toEqual(Object.fromEntries(chosen));
	});
});
