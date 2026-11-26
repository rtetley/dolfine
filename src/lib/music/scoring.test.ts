import { describe, expect, it } from 'vitest';
import {
	type ExpectedNote,
	resultsCommentary,
	type ScoreSummary,
	scorePerformance
} from './scoring';

const expected: ExpectedNote[] = [
	{ id: 'a', midi: 60, time: 0 },
	{ id: 'b', midi: 62, time: 500 },
	{ id: 'c', midi: 64, time: 1000 },
	{ id: 'd', midi: 65, time: 1500 }
];

describe('scorePerformance', () => {
	it('classifies each note against the tolerance', () => {
		const summary = scorePerformance(
			expected,
			[
				{ midi: 60, time: 30 },
				{ midi: 62, time: 380 },
				{ midi: 64, time: 1150 },
				{ midi: 66, time: 1500 }
			],
			80
		);
		expect(summary.notes.map((n) => n.outcome)).toEqual(['correct', 'early', 'late', 'wrong']);
		expect(summary.notes[1].deltaMs).toBe(-120);
		expect(summary.pitchAccuracy).toBe(75);
		expect(summary.rhythmAccuracy).toBe(25);
	});

	it('marks notes outside the search window as missed and keeps extras', () => {
		const summary = scorePerformance(
			expected.slice(0, 1),
			[
				{ midi: 60, time: 2000 },
				{ midi: 72, time: 3000 }
			],
			50
		);
		expect(summary.notes[0].outcome).toBe('missed');
		expect(summary.extras).toHaveLength(2);
	});

	it('uses each played note once, nearest first', () => {
		const repeated: ExpectedNote[] = [
			{ id: 'x', midi: 60, time: 0 },
			{ id: 'y', midi: 60, time: 400 }
		];
		const summary = scorePerformance(repeated, [{ midi: 60, time: 390 }], 50);
		expect(summary.notes.map((n) => n.outcome)).toEqual(['missed', 'correct']);
	});

	it('handles an empty exercise', () => {
		expect(scorePerformance([], [], 50)).toMatchObject({ pitchAccuracy: 0, rhythmAccuracy: 0 });
	});
});

const summaryOf = (
	outcomes: ScoreSummary['notes'][number]['outcome'][],
	pitch: number,
	rhythm: number
): ScoreSummary => ({
	notes: outcomes.map((outcome, i) => ({ id: String(i), outcome })),
	extras: [],
	pitchAccuracy: pitch,
	rhythmAccuracy: rhythm
});

describe('resultsCommentary', () => {
	it.each([
		[summaryOf(['correct'], 100, 100), /Clean and steady/],
		[summaryOf(['missed', 'wrong', 'late'], 33, 0), /wrong notes/],
		[summaryOf(['late', 'late', 'early'], 100, 0), /late/],
		[summaryOf(['early', 'early', 'late'], 100, 0), /rush/]
	])('picks the advice for %#', (summary, pattern) => {
		expect(resultsCommentary(summary)).toMatch(pattern);
	});
});
