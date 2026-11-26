import { describe, expect, it } from 'vitest';
import { exercisesAt } from './curriculum';
import { moduleStatuses } from './dashboard';
import { emptyProgress, type ProgressState } from './ladder';
import { recordAnswer } from './record';

const DAY = '2026-11-25';

function answered(n: number, track: 'theory' | 'ear', exercises: readonly string[]) {
	let state: ProgressState = emptyProgress();
	for (const exercise of exercises) {
		for (let i = 0; i < n; i++) {
			state = recordAnswer(state, { track, level: 1, exercise, correct: true, today: DAY }).state;
		}
	}
	return state;
}

const THEORY_1 = ['name-mode', 'write-mode'];

describe('dashboard statuses', () => {
	it('starts every graded module at Level 1, not yet started', () => {
		const statuses = moduleStatuses(emptyProgress(), {});
		expect(statuses.theory).toEqual({
			graded: true,
			level: 1,
			percent: 0,
			atTop: false,
			started: false
		});
		expect(statuses.ear).toMatchObject({ graded: true, level: 1, started: false });
	});

	it('shows the progress towards the next level as the mean over its exercises', () => {
		const statuses = moduleStatuses(answered(9, 'theory', THEORY_1), {});
		expect(statuses.theory).toMatchObject({ level: 1, percent: 50, started: true });
		const half = moduleStatuses(answered(18, 'theory', ['name-mode']), {});
		expect(half.theory).toMatchObject({ level: 1, percent: 50 });
		const passed = moduleStatuses(answered(18, 'theory', THEORY_1), {});
		expect(passed.theory).toMatchObject({ level: 2, percent: 0, started: true });
	});

	it('follows the single ear-training ladder', () => {
		const state = answered(18, 'ear', ['intervals', 'chords']);
		expect(moduleStatuses(state, {}).ear).toMatchObject({ level: 2, percent: 0 });
	});

	it('marks the top of the ladder', () => {
		const state = emptyProgress();
		const graded = { recent: Array<boolean>(18).fill(true), answered: 18, correct: 18 };
		state.tracks.theory = {
			unlocked: 10,
			levels: {
				10: {
					answered: 0,
					correct: 0,
					drills: Object.fromEntries(exercisesAt('theory', 10).map((e) => [e, graded]))
				}
			}
		};
		expect(moduleStatuses(state, {}).theory).toMatchObject({ atTop: true, percent: 100 });
	});

	it('shows the level chosen for the ungraded module, if any', () => {
		expect(moduleStatuses(emptyProgress(), { rhythm: { level: 7 } }).rhythm).toEqual({
			graded: false,
			level: 7
		});
		expect(moduleStatuses(emptyProgress(), { rhythm: { level: 'fast' } }).rhythm).toEqual({
			graded: false,
			level: null
		});
	});

	it('grades sight reading on its ladder, whatever level was last picked in setup', () => {
		const status = moduleStatuses(emptyProgress(), { 'sight-reading': { level: 6 } });
		expect(status['sight-reading']).toMatchObject({ graded: true, level: 1, started: false });
	});
});
