import { describe, expect, it } from 'vitest';
import type { Level } from '#lib/music/levels.ts';
import {
	drillsAt,
	LANDMARKS,
	pitchPool,
	readingContent,
	type SightReadingDrill
} from '#lib/music/sightReadingLevels.ts';
import { createExercise, exerciseScore, exerciseSummary, metronomeBeat } from './exercise';
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

describe('exerciseSummary', () => {
	const prefs = { ...SIGHT_READING_DEFAULTS, keyFifths: '1', keyMode: 'major' as const };
	const exercise = createExercise(prefs, 3);

	it('names the key with the chosen note names', () => {
		expect(exerciseSummary(exercise, prefs)).toContain('G major');
		expect(exerciseSummary(exercise, prefs, 'solfege')).toContain('Sol major');
	});

	it('describes the mode being run, not the one in the setup', () => {
		expect(exerciseSummary(exercise, prefs)).toMatch(/· Performance$/);
		expect(exerciseSummary(exercise, prefs, 'letters', 'practice')).toMatch(/· Practice$/);
	});
});

describe('Dandelot levels', () => {
	const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8];
	const notesOf = (
		level: Level,
		exercise: SightReadingDrill,
		staff: 'treble' | 'bass' = 'treble',
		seed = 1
	) => {
		const run = createExercise({ ...SIGHT_READING_DEFAULTS, level, exercise, staff }, seed);
		return { run, notes: run.parts[0].measures.flat().filter((note) => note.pitch && !note.rest) };
	};
	const positions = (level: Level, exercise: SightReadingDrill, staff: 'treble' | 'bass') =>
		new Set(
			SEEDS.flatMap((seed) =>
				notesOf(level, exercise, staff, seed).notes.map(
					(note) => `${note.pitch?.letter}${note.pitch?.octave}`
				)
			)
		);

	it('reads only the landmarks at level 1, on either clef, in C', () => {
		expect([...positions(1, 'focus', 'treble')].sort()).toEqual(['C4', 'C5', 'G4', 'G5']);
		expect([...positions(1, 'focus', 'bass')].every((p) => LANDMARKS.bass.includes(p))).toBe(true);
		expect(notesOf(1, 'focus').run.key.fifths).toBe(0);
	});

	it('adds the neighbours at level 2, and the thirds but not the neighbours at level 3', () => {
		const neighbours = positions(2, 'focus', 'treble');
		expect([...neighbours].every((p) => pitchPool('treble', 'neighbours').includes(p))).toBe(true);
		expect(neighbours.has('D4') || neighbours.has('F4') || neighbours.has('A4')).toBe(true);
		const thirds = positions(3, 'focus', 'treble');
		expect([...thirds].every((p) => pitchPool('treble', 'thirds').includes(p))).toBe(true);
		expect(thirds.has('D4') || thirds.has('F4')).toBe(false);
		expect(pitchPool('treble', 'thirds')).toEqual(expect.arrayContaining(['A3', 'E4', 'B4']));
	});

	it('moves only by fourths, fifths, sixths and octaves at level 4', () => {
		for (const seed of SEEDS) {
			const { notes } = notesOf(4, 'focus', 'treble', seed);
			const steps = notes.map(
				(note) => (note.pitch?.octave ?? 0) * 7 + 'CDEFGAB'.indexOf(note.pitch?.letter ?? 'C')
			);
			// The last note may step to the tonic to close the phrase.
			for (let i = 1; i < steps.length - 1; i++) {
				expect([3, 4, 5, 7]).toContain(Math.abs(steps[i] - steps[i - 1]));
			}
		}
	});

	it.each([
		[5, 6, false],
		[6, 4, true],
		[7, 3, false],
		[8, 2, true]
	] as const)(
		'level %i reads one value, %i ticks, before a held last note',
		(level, ticks, triplet) => {
			for (const seed of SEEDS) {
				const { notes } = notesOf(level, 'focus', 'treble', seed);
				notes.slice(0, -1).forEach((note) => {
					expect(note.ticks).toBe(ticks);
					expect(Boolean(note.triplet)).toBe(triplet);
				});
			}
		}
	);

	it('keeps triplets in simple time when 6/8 is chosen in the options', () => {
		const run = createExercise(
			{ ...SIGHT_READING_DEFAULTS, level: 6, exercise: 'focus', meter: '6/8' },
			3
		);
		expect(run.meter.unit).toBe(4);
		expect(createExercise({ ...SIGHT_READING_DEFAULTS, level: 5, meter: '6/8' }, 3).meter).toEqual({
			beats: 6,
			unit: 8
		});
	});

	it('falls back to the level’s first drill when the saved one isn’t graded there', () => {
		expect(readingContent(1, 'review')).toBe(readingContent(1, 'focus'));
		expect(drillsAt(9)).toEqual(['dotted', 'syncopation', 'compound', 'review']);
	});
});
