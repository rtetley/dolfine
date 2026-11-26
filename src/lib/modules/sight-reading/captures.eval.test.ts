import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LETTERS } from '#lib/music/pitch.ts';
import type { ReadingCapture, ReadingLabels } from './capture';
import { asWritten, emptyTally, type Tally, tallyReading } from './captureReview';

/**
 * Scores the current recognition on readings saved in collection mode. Skipped unless pointed at
 * the folder they were downloaded to:
 *
 *   DOLFINE_CAPTURES=~/Downloads pnpm eval:voice
 *
 * Readings without a labels file are counted as read exactly as written, and reported apart.
 */

const folder = process.env.DOLFINE_CAPTURES;

const readJson = (path: string): unknown => JSON.parse(readFileSync(path, 'utf8'));
const isFormat = <T>(value: unknown, format: string): value is T =>
	typeof value === 'object' && value !== null && 'format' in value && value.format === format;

const percent = (part: number, whole: number): string =>
	whole === 0 ? '–' : `${Math.round((part / whole) * 100)}%`;

function report(title: string, tally: Tally, readings: number): string {
	const said = tally.namesRight + tally.namesWrong + tally.namesMissed;
	const rows = LETTERS.filter((letter) => tally.confusions[letter]).map((letter) => {
		const row = tally.confusions[letter] ?? {};
		const cells = Object.entries(row)
			.sort(([, a], [, b]) => b - a)
			.map(([heard, count]) => `${heard} ${count}`);
		return `    said ${letter}: ${cells.join(', ')}`;
	});
	return [
		`${title}: ${readings} readings`,
		`  names said: ${said}, right ${percent(tally.namesRight, said)}, wrong ${percent(tally.namesWrong, said)}, missed ${percent(tally.namesMissed, said)}`,
		`  silence or nonsense: ${tally.notNames}, taken for a name ${percent(tally.falseNames, tally.notNames)}, for the written name ${percent(tally.falseAsScore, tally.notNames)}`,
		'  what the app heard:',
		...rows
	].join('\n');
}

describe.skipIf(!folder)('collected readings', () => {
	it('reports recognition against the labels', () => {
		const files = readdirSync(folder ?? '.').filter(
			(name) => name.startsWith('dolfine-') && name.endsWith('.json')
		);
		const captures = new Map<string, ReadingCapture>();
		const labels = new Map<string, ReadingLabels>();
		for (const name of files) {
			const data = readJson(join(folder ?? '.', name));
			if (isFormat<ReadingCapture>(data, 'dolfine-reading-capture') && data.version === 2) {
				captures.set(data.id, data);
			} else if (isFormat<ReadingLabels>(data, 'dolfine-reading-labels')) {
				labels.set(data.captureId, data);
			}
		}
		const labelled = emptyTally();
		const unlabelled = emptyTally();
		let labelledCount = 0;
		for (const [id, capture] of captures) {
			const own = labels.get(id);
			if (own) labelledCount++;
			tallyReading(own ? labelled : unlabelled, capture, own?.labels ?? asWritten(capture));
		}
		process.stdout.write(
			`\n${report('Labelled', labelled, labelledCount)}\n\n${report('Unlabelled, taken as read as written', unlabelled, captures.size - labelledCount)}\n\n`
		);
		expect(captures.size).toBeGreaterThan(0);
	});
});
