import { describe, expect, it } from 'vitest';
import { parsePitch } from '#lib/music/pitch.ts';
import { keyAccidentals } from '#lib/music/melody.ts';
import { displayAccidentals, expandMeasure, measuresPerLine, splitTicks } from './model';

describe('splitTicks', () => {
	it('uses single durations when possible', () => {
		expect(splitTicks(18).map((d) => [d.code, d.dots])).toEqual([['q', 1]]);
		expect(splitTicks(4, true).map((d) => d.code)).toEqual(['8']);
	});

	it('splits odd lengths into tied parts', () => {
		expect(splitTicks(60).map((d) => d.ticks)).toEqual([48, 12]);
		expect(splitTicks(30).map((d) => d.ticks)).toEqual([24, 6]);
	});
});

describe('expandMeasure', () => {
	it('ties split notes and keeps text on the first part', () => {
		const expanded = expandMeasure([
			{ id: 'n1', ticks: 60, rest: false, pitches: [], below: 'Doo' }
		]);
		expect(expanded.map((n) => [n.id, n.tie, n.below])).toEqual([
			['n1', true, 'Doo'],
			['n1~1', undefined, undefined]
		]);
	});
});

describe('displayAccidentals', () => {
	it('respects the key signature and bar-level state', () => {
		const measure = [
			{ id: 'a', ticks: 12, rest: false, pitches: [parsePitch('F#4')] },
			{ id: 'b', ticks: 12, rest: false, pitches: [parsePitch('F4')] },
			{ id: 'c', ticks: 12, rest: false, pitches: [parsePitch('F4')] },
			{ id: 'd', ticks: 12, rest: false, pitches: [parsePitch('F#4')] }
		];
		const shown = displayAccidentals(measure, keyAccidentals(1));
		expect(['a', 'b', 'c', 'd'].map((id) => shown.get(id)?.[0])).toEqual([null, 0, null, 1]);
	});
});

describe('measuresPerLine', () => {
	it('fits the width', () => {
		expect(measuresPerLine(1000, 8)).toBe(4);
		expect(measuresPerLine(400, 8)).toBe(2);
		expect(measuresPerLine(1000, 3)).toBe(3);
	});
});
