import { describe, expect, it } from 'vitest';
import { noteName, parsePitch, toMidi } from '#lib/music/pitch.ts';
import { modeScale } from '#lib/music/scales.ts';
import { LIMITS } from '#lib/music/voicings.ts';
import { grandStaff } from './display';
import { voicingRuleIssues, writtenChordColumn, writtenScaleScore } from './liveStaff';
import type { ModeQuestion } from './questions';

const D = { letter: 'D', accidental: 0 } as const;
const eDorianFlat2 = {
	kind: 'write-mode',
	mode: 'melodicMinor:2',
	modeRoot: D,
	parentRoot: { letter: 'C', accidental: 0 },
	notes: modeScale('melodicMinor:2', { ...D, octave: 4 }),
	options: []
} satisfies ModeQuestion;

const bar = (score: ReturnType<typeof writtenScaleScore>) => score.parts[0].measures[0];

describe('writtenScaleScore', () => {
	it('shows a rest before anything is written', () => {
		expect(bar(writtenScaleScore(eDorianFlat2, []))[0].rest).toBe(true);
	});

	it('writes notes in ascending order whatever the playing order', () => {
		const midis = ['F4', 'D4', 'E♭4'].map((n) => toMidi(parsePitch(n.replace('♭', 'b'))));
		const names = bar(writtenScaleScore(eDorianFlat2, midis)).map((n) => noteName(n.pitches[0]));
		expect(names).toEqual(['D', 'E♭', 'F']);
	});

	it('spells right notes with the scale’s letters and leaves wrong ones plain', () => {
		const names = bar(writtenScaleScore(eDorianFlat2, [62, 63, 66])).map((n) =>
			noteName(n.pitches[0])
		);
		expect(names).toEqual(['D', 'E♭', 'F♯']);
	});

	it('colours each note once the answer is checked', () => {
		const score = writtenScaleScore(
			eDorianFlat2,
			[62, 64],
			[
				{ midi: 62, ok: true },
				{ midi: 64, ok: false }
			]
		);
		expect(bar(score).map((n) => n.style)).toEqual(['correct', 'wrong']);
	});
});

describe('voicingRuleIssues', () => {
	it('accepts a well-placed type A voicing', () => {
		expect(voicingRuleIssues([50, 60, 65, 69, 76], 2)).toEqual({
			flagged: new Set(),
			messages: []
		});
	});

	it('flags the right hand above A5 and below G3', () => {
		const high = voicingRuleIssues([48, 58, LIMITS.rhTop + 2], 2);
		expect([...high.flagged]).toEqual([LIMITS.rhTop + 2]);
		expect(high.messages).toEqual(['The right hand goes above A5.']);
		const low = voicingRuleIssues([40, 50, 53], 2);
		expect(low.messages).toContain('The right hand goes below G3.');
	});

	it('flags a root below E2', () => {
		expect(voicingRuleIssues([38, 48], 2).messages).toContain('The root is below E2.');
	});

	it('flags both notes of a muddy low interval, with or without hands', () => {
		const issues = voicingRuleIssues([40, 43]);
		expect([...issues.flagged]).toEqual([40, 43]);
		expect(issues.messages).toEqual([
			'An interval sits below its low interval limit and will sound muddy.'
		]);
	});

	it('ignores range rules until the right hand has notes', () => {
		expect(voicingRuleIssues([47], 2).messages).toEqual([]);
	});
});

describe('writtenChordColumn', () => {
	const g7 = { root: { letter: 'G', accidental: 0 }, mode: 'major:5' } as const;

	it('spells the chord and marks flagged notes on the right staff', () => {
		const column = writtenChordColumn('c', g7, [65, 43, 59], {
			lhCount: 1,
			flagged: new Set([43])
		});
		expect(column.pitches.map((p) => noteName(p))).toEqual(['G', 'B', 'F']);
		const [treble, bass] = grandStaff([column]).parts;
		expect(bass.measures[0][0].keyStyles).toEqual(['wrong']);
		expect(treble.measures[0][0].keyStyles).toBeUndefined();
		expect(treble.measures[0][0].pitches).toHaveLength(2);
	});
});
