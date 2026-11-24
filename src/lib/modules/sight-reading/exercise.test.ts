import { describe, expect, it } from 'vitest';
import { createExercise, exerciseScore, metronomeBeat } from './exercise';
import { SIGHT_READING_DEFAULTS } from './prefs';

describe('sight-reading exercise', () => {
	it('is reproducible from its seed', () => {
		const a = createExercise(SIGHT_READING_DEFAULTS, 99);
		const b = createExercise(SIGHT_READING_DEFAULTS, 99);
		expect(a.expected).toEqual(b.expected);
	});

	it('times notes from the tempo', () => {
		const exercise = createExercise({ ...SIGHT_READING_DEFAULTS, tempo: 60, meter: '4/4' }, 1);
		expect(exercise.durationMs).toBeCloseTo(exercise.bars * 4000);
		exercise.expected.forEach((note) => {
			expect(note.time).toBeGreaterThanOrEqual(0);
			expect(note.time).toBeLessThan(exercise.durationMs);
		});
	});

	it('adds a bass part on the grand staff', () => {
		const exercise = createExercise({ ...SIGHT_READING_DEFAULTS, staff: 'grand' }, 4);
		expect(exercise.parts.map((p) => p.clef)).toEqual(['treble', 'bass']);
		expect(exerciseScore(exercise, { showReferences: false }).parts).toHaveLength(2);
	});

	it('honours a fixed key and meter override', () => {
		const exercise = createExercise({ ...SIGHT_READING_DEFAULTS, keyFifths: '3', meter: '6/8' }, 2);
		expect(exercise.key.fifths).toBe(3);
		expect(exercise.meter).toEqual({ beats: 6, unit: 8 });
	});

	it('clicks eighths in x/8 meters', () => {
		expect(metronomeBeat({ beats: 6, unit: 8 }, 60)).toEqual({ bpm: 120, beatsPerBar: 6 });
	});
});
