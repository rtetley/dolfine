import { describe, expect, it } from 'vitest';
import { measureTicks, totalTicks } from '#lib/music/rhythm.ts';
import {
	chooseRatio,
	createRhythmExercise,
	listenSchedule,
	RHYTHM_DEFAULTS,
	rhythmScore
} from './reading';

describe('rhythm reading exercise', () => {
	it('fills every bar and is reproducible', () => {
		const a = createRhythmExercise(RHYTHM_DEFAULTS, 11);
		const b = createRhythmExercise(RHYTHM_DEFAULTS, 11);
		expect(a.measures).toEqual(b.measures);
		a.measures.forEach((m) => expect(totalTicks(m)).toBe(measureTicks(a.meter)));
	});

	it('fades syllables out over the second half', () => {
		const exercise = createRhythmExercise({ ...RHYTHM_DEFAULTS, bars: 4 }, 3);
		const score = rhythmScore(exercise, 'fade');
		const lastBar = score.parts[0]?.measures[3] ?? [];
		expect(lastBar.every((note) => note.below === undefined)).toBe(true);
	});

	it('does not re-attack tied notes when listening', () => {
		const exercise = createRhythmExercise({ ...RHYTHM_DEFAULTS, level: 5, feel: 'straight' }, 8);
		const notes = exercise.measures.flat();
		const attacks = notes.filter((n, i) => !n.rest && !notes[i - 1]?.tie).length;
		expect(listenSchedule(exercise)).toHaveLength(attacks);
	});

	it('uses a fixed ratio when chosen', () => {
		expect(chooseRatio({ ...RHYTHM_DEFAULTS, ratio: '5:4' }, 1)).toEqual([5, 4]);
	});
});
