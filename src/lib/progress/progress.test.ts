import { describe, expect, it } from 'vitest';
import { LEVELS, type Level } from '#lib/music/levels.ts';
import { EAR_SUBMODULES } from '#lib/modules/ear/questions.ts';
import { THEORY_EXERCISES } from '#lib/modules/theory/questions.ts';
import { drillsAt } from '#lib/music/sightReadingLevels.ts';
import { newlyEarned } from './achievements';
import {
	CURRICULA,
	EAR_SUBMODULES_GRADED,
	exercisesAt,
	openDrill,
	THEORY_CURRICULUM
} from './curriculum';
import {
	dayStreak,
	emptyProgress,
	moduleStanding,
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

interface Where {
	track?: TrackId;
	level?: Level;
	exercise?: string;
	today?: string;
}

function answer(
	state: ProgressState,
	results: boolean[],
	{ track = 'theory', level = 1, exercise = 'name-mode', today = DAY }: Where = {}
): { state: ProgressState; events: ProgressEvent[] } {
	let events: ProgressEvent[] = [];
	for (const correct of results) {
		const recorded = recordAnswer(state, { track, level, exercise, correct, today });
		state = recorded.state;
		events = [...events, ...recorded.events];
	}
	return { state, events };
}

const times = (n: number, value = true): boolean[] => Array.from({ length: n }, () => value);

/** Grades every exercise of a level. */
function pass(state: ProgressState, track: TrackId, level: Level) {
	let events: ProgressEvent[] = [];
	for (const exercise of exercisesAt(track, level)) {
		const recorded = answer(state, times(REQUIRED_CORRECT), { track, level, exercise });
		state = recorded.state;
		events = [...events, ...recorded.events];
	}
	return { state, events };
}

describe('the curriculum', () => {
	it('gives every level of both modules a few known exercises', () => {
		for (const level of LEVELS) {
			const theory = exercisesAt('theory', level);
			const ear = exercisesAt('ear', level);
			expect(theory.length).toBeGreaterThan(0);
			expect(ear.length).toBeGreaterThan(0);
			expect(new Set(theory).size).toBe(theory.length);
			expect(new Set(ear).size).toBe(ear.length);
			expect(theory.every((e) => (THEORY_EXERCISES as readonly string[]).includes(e))).toBe(true);
			expect(ear.every((e) => (EAR_SUBMODULES as readonly string[]).includes(e))).toBe(true);
		}
	});

	it('starts music theory with naming and writing major modes, then chords', () => {
		expect(exercisesAt('theory', 1)).toEqual(['name-mode', 'write-mode']);
		expect(THEORY_CURRICULUM[1].lesson).toBe('major');
		expect(exercisesAt('theory', 2)).toEqual(
			expect.arrayContaining(['name-chord', 'build-chord', 'name-mode', 'write-mode'])
		);
		expect(exercisesAt('theory', 3)).toContain('voice-chord');
		expect(THEORY_CURRICULUM[4].lesson).toBe('melodic-minor');
		expect(THEORY_CURRICULUM[8].lesson).toBe('harmonic-minor');
	});

	it('never asks for a drill harder than its level', () => {
		for (const module of ['theory', 'ear'] as const) {
			for (const level of LEVELS) {
				for (const drill of CURRICULA[module][level].drills) {
					expect(drill.difficulty).toBeLessThanOrEqual(level);
				}
			}
		}
	});

	it('lists every ear sub-module for the breadth achievement', () => {
		expect(EAR_SUBMODULES_GRADED).toEqual(EAR_SUBMODULES);
	});

	it('reopens a saved exercise only where it is still open and graded', () => {
		expect(openDrill(THEORY_CURRICULUM, { level: 2, exercise: 'name-chord' }, 3)).toEqual({
			level: 2,
			exercise: 'name-chord'
		});
		expect(openDrill(THEORY_CURRICULUM, { level: 5, exercise: 'name-chord' }, 2)).toEqual({
			level: 2,
			exercise: 'name-chord'
		});
		expect(openDrill(THEORY_CURRICULUM, { level: 1, exercise: 'voice-leading' }, 1)).toEqual({
			level: 1,
			exercise: 'name-mode'
		});
	});
});

describe('the ladder', () => {
	it('asks for 18 of the last 20 answers on each exercise', () => {
		expect(UNLOCK_WINDOW).toBe(20);
		expect(REQUIRED_CORRECT).toBe(18);
	});

	it('unlocks the next level only once every exercise has its grade', () => {
		const one = answer(emptyProgress(), times(REQUIRED_CORRECT)).state;
		expect(trackOf(one, 'theory').unlocked).toBe(1);
		expect(moduleStanding(one, 'theory', 1)).toMatchObject({ ratio: 0.5, passed: false });

		const before = answer(one, times(REQUIRED_CORRECT - 1), { exercise: 'write-mode' }).state;
		expect(trackOf(before, 'theory').unlocked).toBe(1);

		const { state, events } = answer(before, [true], { exercise: 'write-mode' });
		expect(trackOf(state, 'theory').unlocked).toBe(2);
		expect(events).toContainEqual({ kind: 'level-unlocked', track: 'theory', level: 2 });
	});

	it('does not count exercises that the level does not grade', () => {
		const { state } = answer(emptyProgress(), times(40), { exercise: 'voice-leading' });
		expect(trackOf(state, 'theory').unlocked).toBe(1);
		expect(moduleStanding(state, 'theory', 1).ratio).toBe(0);
	});

	it('only counts the most recent window of each exercise', () => {
		// 10 wrong, then 18 right: the wrong ones slide out of the last 20 after 8 more.
		let state = answer(emptyProgress(), times(18), { exercise: 'write-mode' }).state;
		state = answer(state, times(10, false)).state;
		state = answer(state, times(10)).state;
		expect(trackOf(state, 'theory').unlocked).toBe(1);
		state = answer(state, times(8)).state;
		expect(trackOf(state, 'theory').unlocked).toBe(2);
		const record = trackOf(state, 'theory').levels[1];
		expect(record?.drills['name-mode']?.recent).toHaveLength(UNLOCK_WINDOW);
		expect(record?.drills['name-mode']?.answered).toBe(28);
		expect(record?.answered).toBe(46);
	});

	it('keeps the same exercise separate at each level', () => {
		const { state } = answer(emptyProgress(), times(18), { level: 2 });
		expect(moduleStanding(state, 'theory', 1).drills[0]?.recentCorrect).toBe(0);
		expect(moduleStanding(state, 'theory', 2).drills).toContainEqual(
			expect.objectContaining({ exercise: 'name-mode', recentCorrect: 18 })
		);
	});

	it('does not reopen a level below the frontier or go past 10', () => {
		let state = pass(emptyProgress(), 'theory', 1).state;
		state = pass(state, 'theory', 2).state;
		expect(trackOf(state, 'theory').unlocked).toBe(3);
		const again = pass(state, 'theory', 1);
		expect(trackOf(again.state, 'theory').unlocked).toBe(3);
		expect(again.events.some((e) => e.kind === 'level-unlocked')).toBe(false);

		const top = pass(emptyProgress(), 'ear', 10);
		expect(trackOf(top.state, 'ear').unlocked).toBe(10);
	});

	it('lets a pass above the frontier (open ladder) move the frontier past it', () => {
		const { state } = pass(emptyProgress(), 'ear', 6);
		expect(trackOf(state, 'ear').unlocked).toBe(7);
	});

	it('keeps each module separate', () => {
		const { state } = pass(emptyProgress(), 'ear', 1);
		expect(trackOf(state, 'ear').unlocked).toBe(2);
		expect(trackOf(state, 'theory').unlocked).toBe(1);
	});

	it('reports the standing towards the next level', () => {
		const state = answer(emptyProgress(), [true, false, true, true]).state;
		const standing = moduleStanding(state, 'theory', 1);
		expect(standing.drills[0]).toMatchObject({
			exercise: 'name-mode',
			recentCorrect: 3,
			recentAnswered: 4,
			passed: false
		});
		expect(percent(standing.drills[0]?.ratio ?? 0)).toBe(17);
		expect(percent(standing.ratio)).toBe(8);
		expect(moduleStanding(state, 'theory', 2).ratio).toBe(0);

		const passed = pass(state, 'theory', 1).state;
		expect(moduleStanding(passed, 'theory', 1)).toMatchObject({ ratio: 1, passed: true });
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

		const { state, events } = answer(emptyProgress(), [true, false]);
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
		let state = answer(emptyProgress(), [true, true], { today: '2026-11-24' }).state;
		state = answer(state, [true]).state;
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

describe('achievements', () => {
	it('awards each one once, with the day', () => {
		const first = answer(emptyProgress(), [true]);
		expect(first.events).toContainEqual({ kind: 'achievement', id: 'first-answer' });
		expect(first.state.achievements['first-answer']).toBe(DAY);

		const second = answer(first.state, [true]);
		expect(second.events.some((e) => e.kind === 'achievement')).toBe(false);
	});

	it('marks right answers, runs, level-ups and breadth', () => {
		const { state } = pass(emptyProgress(), 'theory', 1);
		expect(Object.keys(state.achievements)).toEqual(
			expect.arrayContaining(['correct-10', 'run-10', 'run-25', 'first-level-up'])
		);
		expect(state.achievements['correct-100']).toBeUndefined();

		let both = answer(state, [true], { track: 'ear', exercise: 'chords' }).state;
		expect(both.achievements['theory-and-ear']).toBe(DAY);
		for (const exercise of ['intervals', 'voicings', 'modes', 'colours']) {
			both = answer(both, [false], { track: 'ear', exercise }).state;
		}
		expect(both.achievements['all-ears']).toBeUndefined();
		both = answer(both, [false], { track: 'ear', level: 4, exercise: 'progressions' }).state;
		expect(both.achievements['all-ears']).toBe(DAY);
	});

	it('follows practice-day streaks', () => {
		let state = emptyProgress();
		for (const today of ['2026-11-23', '2026-11-24', DAY]) {
			state = answer(state, [false], { today }).state;
		}
		expect(state.achievements['days-3']).toBe(DAY);
		expect(newlyEarned(state, DAY)).toEqual([]);
	});

	it('marks the high rungs of the ladder', () => {
		const { state } = pass(emptyProgress(), 'theory', 9);
		expect(state.achievements['level-5']).toBe(DAY);
		expect(state.achievements['level-10']).toBe(DAY);
	});
});

describe('reading stored progress', () => {
	it('round-trips a real state', () => {
		const { state } = answer(emptyProgress(), [true, false, true], {
			track: 'ear',
			level: 3,
			exercise: 'voicings'
		});
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
				theory: {
					unlocked: 4,
					levels: {
						3: { answered: 5, correct: 9, drills: { 'name-mode': { recent: [true, 'x', false] } } }
					}
				},
				ear: { unlocked: 42, levels: { 11: { drills: {} } } },
				piano: { unlocked: 5 }
			},
			achievements: { 'first-answer': '2026-11-20', 'not-a-thing': '2026-11-20', 'run-10': 3 }
		});
		expect(state).toMatchObject({ xp: 120, answered: 10, correct: 10, run: 0, bestRun: 0 });
		expect(state.days).toEqual(['2026-11-20', '2026-11-24']);
		expect(state.tracks.theory).toEqual({
			unlocked: 4,
			levels: {
				3: {
					answered: 5,
					correct: 5,
					drills: { 'name-mode': { recent: [true, false], answered: 2, correct: 0 } }
				}
			}
		});
		expect(state.tracks.ear).toEqual({ unlocked: 1, levels: {} });
		expect(state.achievements).toEqual({ 'first-answer': '2026-11-20' });
	});

	it('keeps the frontier of a save from before per-exercise grades', () => {
		const state = readProgress({
			tracks: {
				theory: { unlocked: 3, levels: { 3: { recent: [true], answered: 1, correct: 1 } } },
				'ear:chords': { unlocked: 5, levels: {} },
				'ear:modes': { unlocked: 2, levels: {} },
				'ear:kazoo': 'oops'
			}
		});
		expect(state.tracks.theory).toEqual({
			unlocked: 3,
			levels: { 3: { answered: 1, correct: 1, drills: {} } }
		});
		expect(state.tracks.ear).toEqual({ unlocked: 4, levels: {} });
	});
});

describe('placing a student', () => {
	it('opens every level up to the one chosen, as if passed', () => {
		const state = placeOnLevel(emptyProgress(), 'ear', 4);
		expect(trackOf(state, 'ear').unlocked).toBe(4);
		expect(moduleStanding(state, 'ear', 3).passed).toBe(true);
		expect(moduleStanding(state, 'ear', 4).passed).toBe(false);
	});

	it('never lowers a track', () => {
		const state = placeOnLevel(emptyProgress(), 'theory', 6);
		expect(placeOnLevel(state, 'theory', 2)).toBe(state);
	});
});

describe('sight-reading ladder', () => {
	it('grades exactly the drills the level table defines', () => {
		for (const level of LEVELS) {
			expect(exercisesAt('sight-reading', level)).toEqual(drillsAt(level));
		}
	});

	const run = (state: ProgressState, level: Level, exercise: string, passed: boolean) =>
		recordAnswer(state, {
			track: 'sight-reading',
			level,
			exercise,
			correct: passed,
			today: '2026-11-26'
		}).state;

	it('leaves the tutorial after two passing runs among three', () => {
		const once = run(emptyProgress(), 1, 'focus', true);
		expect(trackOf(once, 'sight-reading').unlocked).toBe(1);
		const twice = run(run(once, 1, 'focus', false), 1, 'focus', true);
		expect(trackOf(twice, 'sight-reading').unlocked).toBe(2);
	});

	it('opens the next level after four passing runs among five on every drill', () => {
		let state = placeOnLevel(emptyProgress(), 'sight-reading', 2);
		for (const passed of [true, true, false, true, true]) state = run(state, 2, 'focus', passed);
		expect(moduleStanding(state, 'sight-reading', 2).passed).toBe(false);
		for (const passed of [true, true, true]) state = run(state, 2, 'review', passed);
		expect(trackOf(state, 'sight-reading').unlocked).toBe(2);
		state = run(state, 2, 'review', true);
		expect(trackOf(state, 'sight-reading').unlocked).toBe(3);
	});

	it('only looks at the last five runs', () => {
		let state = placeOnLevel(emptyProgress(), 'sight-reading', 3);
		for (const passed of [true, true, true, true, false, false])
			state = run(state, 3, 'focus', passed);
		const standing = moduleStanding(state, 'sight-reading', 3).drills[0];
		expect(standing).toMatchObject({ recentCorrect: 3, required: 4, window: 5, passed: false });
	});
});
