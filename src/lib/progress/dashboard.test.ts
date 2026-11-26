import { describe, expect, it } from 'vitest';
import { moduleStatuses } from './dashboard';
import { emptyProgress, type ProgressState } from './ladder';
import { recordAnswer } from './record';

const DAY = '2026-11-25';

function answered(n: number, track: 'theory' | 'ear:chords' | 'ear:modes', correct = true) {
	let state: ProgressState = emptyProgress();
	for (let i = 0; i < n; i++) {
		state = recordAnswer(state, { track, level: 1, correct, today: DAY }).state;
	}
	return state;
}

describe('dashboard statuses', () => {
	it('starts every graded module at Level 1, not yet started', () => {
		const statuses = moduleStatuses(emptyProgress(), {});
		expect(statuses.theory).toEqual({
			graded: true,
			estimate: 1,
			track: 'theory',
			level: 1,
			percent: 0,
			atTop: false,
			started: false
		});
		expect(statuses.ear).toMatchObject({ graded: true, track: 'ear:chords', started: false });
	});

	it('shows the progress towards the next level on the current track', () => {
		const statuses = moduleStatuses(answered(9, 'theory'), {});
		expect(statuses.theory).toMatchObject({ level: 1, percent: 50, started: true });
		const passed = moduleStatuses(answered(18, 'theory'), {});
		expect(passed.theory).toMatchObject({ estimate: 2, level: 2, percent: 0, started: true });
	});

	it('follows the ear sub-module last chosen in setup', () => {
		const state = answered(18, 'ear:modes');
		expect(moduleStatuses(state, { ear: { submodule: 'modes' } }).ear).toMatchObject({
			track: 'ear:modes',
			level: 2,
			estimate: 2
		});
		expect(moduleStatuses(state, { ear: { submodule: 'chords' } }).ear).toMatchObject({
			track: 'ear:chords',
			level: 1,
			estimate: 2
		});
		expect(moduleStatuses(state, { ear: { submodule: 'kazoo' } }).ear).toMatchObject({
			track: 'ear:chords'
		});
	});

	it('marks the top of the ladder', () => {
		const state = emptyProgress();
		state.tracks.theory = {
			unlocked: 10,
			levels: { 10: { recent: Array<boolean>(18).fill(true), answered: 18, correct: 18 } }
		};
		expect(moduleStatuses(state, {}).theory).toMatchObject({ atTop: true, percent: 100 });
	});

	it('shows the level chosen for ungraded modules, if any', () => {
		const statuses = moduleStatuses(emptyProgress(), {
			'sight-reading': { level: 6 },
			rhythm: { level: 'fast' }
		});
		expect(statuses['sight-reading']).toEqual({ graded: false, level: 6 });
		expect(statuses.rhythm).toEqual({ graded: false, level: null });
	});
});
