import { describe, expect, it } from 'vitest';
import type { Level } from '#lib/music/levels.ts';
import { EAR_SUBMODULES } from '#lib/modules/ear/questions.ts';
import { newlyEarned } from './achievements';
import {
	dayStreak,
	EAR_TRACK_SUBMODULES,
	emptyProgress,
	estimatedLevel,
	levelStanding,
	localDay,
	percent,
	type ProgressState,
	REQUIRED_CORRECT,
	shiftDay,
	type TrackId,
	trackOf,
	UNLOCK_WINDOW,
	xpFor
} from './ladder';
import { placeOnLevel, type ProgressEvent, recordAnswer } from './record';
import { readProgress } from './stored';

const DAY = '2026-11-25';

function answer(
	state: ProgressState,
	results: boolean[],
	track: TrackId = 'theory',
	level: Level = 1,
	today = DAY
): { state: ProgressState; events: ProgressEvent[] } {
	let events: ProgressEvent[] = [];
	for (const correct of results) {
		const recorded = recordAnswer(state, { track, level, correct, today });
		state = recorded.state;
		events = [...events, ...recorded.events];
	}
	return { state, events };
}

const times = (n: number, value = true): boolean[] => Array.from({ length: n }, () => value);

describe('the ladder', () => {
	it('has one track per ear sub-module', () => {
		expect(EAR_TRACK_SUBMODULES).toEqual(EAR_SUBMODULES);
	});

	it('asks for 18 of the last 20 answers', () => {
		expect(UNLOCK_WINDOW).toBe(20);
		expect(REQUIRED_CORRECT).toBe(18);
	});

	it('unlocks the next level once enough recent answers are right', () => {
		const before = answer(emptyProgress(), times(REQUIRED_CORRECT - 1)).state;
		expect(trackOf(before, 'theory').unlocked).toBe(1);

		const { state, events } = answer(before, [true]);
		expect(trackOf(state, 'theory').unlocked).toBe(2);
		expect(events).toContainEqual({ kind: 'level-unlocked', track: 'theory', level: 2 });
	});

	it('only counts the most recent window', () => {
		// 10 wrong, then 18 right: the wrong ones slide out of the last 20 after 8 more.
		let state = answer(emptyProgress(), times(10, false)).state;
		state = answer(state, times(10)).state;
		expect(trackOf(state, 'theory').unlocked).toBe(1);
		state = answer(state, times(8)).state;
		expect(trackOf(state, 'theory').unlocked).toBe(2);
		expect(trackOf(state, 'theory').levels[1]?.recent).toHaveLength(UNLOCK_WINDOW);
		expect(trackOf(state, 'theory').levels[1]?.answered).toBe(28);
	});

	it('does not reopen a level below the frontier or go past 10', () => {
		let state = answer(emptyProgress(), times(18), 'theory', 1).state;
		state = answer(state, times(18), 'theory', 2).state;
		expect(trackOf(state, 'theory').unlocked).toBe(3);
		const again = answer(state, times(18), 'theory', 1);
		expect(trackOf(again.state, 'theory').unlocked).toBe(3);
		expect(again.events.some((e) => e.kind === 'level-unlocked')).toBe(false);

		const top = answer(emptyProgress(), times(20), 'ear:chords', 10);
		expect(trackOf(top.state, 'ear:chords').unlocked).toBe(10);
	});

	it('lets a pass above the frontier (open ladder) move the frontier past it', () => {
		const { state } = answer(emptyProgress(), times(18), 'ear:modes', 6);
		expect(trackOf(state, 'ear:modes').unlocked).toBe(7);
	});

	it('keeps each track separate', () => {
		const { state } = answer(emptyProgress(), times(18), 'ear:intervals');
		expect(trackOf(state, 'ear:intervals').unlocked).toBe(2);
		expect(trackOf(state, 'ear:chords').unlocked).toBe(1);
		expect(trackOf(state, 'theory').unlocked).toBe(1);
	});

	it('reports the standing towards the next level', () => {
		const state = answer(emptyProgress(), [true, false, true, true]).state;
		const standing = levelStanding(trackOf(state, 'theory'), 1);
		expect(standing).toMatchObject({ recentCorrect: 3, recentAnswered: 4, passed: false });
		expect(percent(standing.ratio)).toBe(17);
		expect(levelStanding(trackOf(state, 'theory'), 2).ratio).toBe(0);

		const passed = answer(state, times(18)).state;
		expect(levelStanding(trackOf(passed, 'theory'), 1)).toMatchObject({ ratio: 1, passed: true });
	});

	it('clamps percentages', () => {
		expect(percent(-1)).toBe(0);
		expect(percent(2)).toBe(100);
	});
});

describe('XP, totals and runs', () => {
	it('pays more for harder levels and a point for a wrong answer', () => {
		expect(xpFor(1, true)).toBe(10);
		expect(xpFor(10, true)).toBe(28);
		expect(xpFor(5, false)).toBe(1);

		const { state, events } = answer(emptyProgress(), [true, false], 'theory', 1);
		expect(state.xp).toBe(11);
		expect(events.filter((e) => e.kind === 'xp')).toEqual([
			{ kind: 'xp', amount: 10 },
			{ kind: 'xp', amount: 1 }
		]);
	});

	it('counts answers and the best run of right answers', () => {
		const { state } = answer(emptyProgress(), [true, true, true, false, true]);
		expect(state).toMatchObject({ answered: 5, correct: 4, run: 1, bestRun: 3 });
	});

	it('logs each practice day once', () => {
		let state = answer(emptyProgress(), [true, true], 'theory', 1, '2026-11-24').state;
		state = answer(state, [true], 'theory', 1, DAY).state;
		expect(state.days).toEqual(['2026-11-24', DAY]);
	});
});

describe('days', () => {
	it('counts a streak ending today or yesterday', () => {
		const days = ['2026-11-20', '2026-11-22', '2026-11-23', '2026-11-24'];
		expect(dayStreak(days, '2026-11-24')).toBe(3);
		expect(dayStreak(days, '2026-11-25')).toBe(3);
		expect(dayStreak(days, '2026-11-26')).toBe(0);
		expect(dayStreak([], DAY)).toBe(0);
	});

	it('shifts across months and years', () => {
		expect(shiftDay('2026-03-01', -1)).toBe('2026-02-28');
		expect(shiftDay('2026-12-31', 1)).toBe('2027-01-01');
	});

	it('formats the local day', () => {
		expect(localDay(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
	});
});

describe('estimated level', () => {
	it('follows the theory track', () => {
		const state = answer(emptyProgress(), times(18)).state;
		expect(estimatedLevel(state, 'theory')).toBe(2);
		expect(estimatedLevel(emptyProgress(), 'ear')).toBe(1);
	});

	it('averages the ear sub-modules the student has practised', () => {
		let state = answer(emptyProgress(), times(18), 'ear:chords', 4).state; // chords → 5
		expect(estimatedLevel(state, 'ear')).toBe(5);
		state = answer(state, [false], 'ear:intervals', 1).state; // intervals stays at 1
		expect(estimatedLevel(state, 'ear')).toBe(3);
	});
});

describe('achievements', () => {
	it('awards each one once, with the day', () => {
		const first = answer(emptyProgress(), [true]);
		expect(first.events).toContainEqual({ kind: 'achievement', id: 'first-answer' });
		expect(first.state.achievements['first-answer']).toBe(DAY);

		const second = answer(first.state, [true]);
		expect(second.events.some((e) => e.kind === 'achievement')).toBe(false);
	});

	it('marks right answers, runs, level-ups and breadth', () => {
		const { state } = answer(emptyProgress(), times(25));
		expect(Object.keys(state.achievements)).toEqual(
			expect.arrayContaining(['correct-10', 'run-10', 'run-25', 'first-level-up'])
		);
		expect(state.achievements['correct-100']).toBeUndefined();

		let both = answer(state, [true], 'ear:chords').state;
		expect(both.achievements['theory-and-ear']).toBe(DAY);
		for (const sub of ['intervals', 'voicings', 'modes', 'progressions'] as const) {
			both = answer(both, [false], `ear:${sub}`).state;
		}
		expect(both.achievements['all-ears']).toBe(DAY);
	});

	it('follows practice-day streaks', () => {
		let state = emptyProgress();
		for (const day of ['2026-11-23', '2026-11-24', DAY]) {
			state = answer(state, [false], 'theory', 1, day).state;
		}
		expect(state.achievements['days-3']).toBe(DAY);
		expect(newlyEarned(state, DAY)).toEqual([]);
	});

	it('marks the high rungs of the ladder', () => {
		const { state } = answer(emptyProgress(), times(18), 'theory', 9);
		expect(state.achievements['level-5']).toBe(DAY);
		expect(state.achievements['level-10']).toBe(DAY);
	});
});

describe('reading stored progress', () => {
	it('round-trips a real state', () => {
		const { state } = answer(emptyProgress(), [true, false, true], 'ear:modes', 3);
		expect(readProgress(JSON.parse(JSON.stringify(state)))).toEqual(state);
	});

	it('starts empty from nothing or garbage', () => {
		expect(readProgress(null)).toEqual(emptyProgress());
		expect(readProgress('progress')).toEqual(emptyProgress());
		expect(readProgress([1, 2])).toEqual(emptyProgress());
	});

	it('keeps the valid parts of a damaged save', () => {
		const state = readProgress({
			xp: 120,
			answered: 10,
			correct: 99,
			run: -3,
			bestRun: 'many',
			days: ['2026-11-24', 'yesterday', '2026-11-24', '2026-11-20'],
			tracks: {
				theory: { unlocked: 4, levels: { 3: { recent: [true, 'x', false], answered: 1 } } },
				'ear:chords': { unlocked: 42, levels: { 11: { recent: [] } } },
				piano: { unlocked: 5 },
				'ear:modes': 'oops'
			},
			achievements: { 'first-answer': '2026-11-20', 'not-a-thing': '2026-11-20', 'run-10': 3 }
		});
		expect(state).toMatchObject({ xp: 120, answered: 10, correct: 10, run: 0, bestRun: 0 });
		expect(state.days).toEqual(['2026-11-20', '2026-11-24']);
		expect(state.tracks.theory).toEqual({
			unlocked: 4,
			levels: { 3: { recent: [true, false], answered: 2, correct: 0 } }
		});
		expect(state.tracks['ear:chords']).toEqual({ unlocked: 1, levels: {} });
		expect(state.tracks['ear:modes']).toBeUndefined();
		expect(state.achievements).toEqual({ 'first-answer': '2026-11-20' });
	});
});

describe('placing a student', () => {
	it('opens every level up to the one chosen, as if passed', () => {
		const state = placeOnLevel(emptyProgress(), 'ear:chords', 4);
		expect(trackOf(state, 'ear:chords').unlocked).toBe(4);
		expect(levelStanding(trackOf(state, 'ear:chords'), 3).passed).toBe(true);
		expect(levelStanding(trackOf(state, 'ear:chords'), 4).passed).toBe(false);
	});

	it('never lowers a track', () => {
		const state = placeOnLevel(emptyProgress(), 'theory', 6);
		expect(placeOnLevel(state, 'theory', 2)).toBe(state);
	});
});
