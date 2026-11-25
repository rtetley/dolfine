import { describe, expect, it } from 'vitest';
import { CLASSICAL_MAPPING, JAZZ_MAPPING, LEVELS, THEORY_LEVELS } from '#lib/music/levels.ts';
import { toMidi } from '#lib/music/pitch.ts';
import { measureTicks, totalTicks } from '#lib/music/rhythm.ts';
import { RHYTHM_READING_LEVELS } from '#lib/music/rhythmLevels.ts';
import { SIGHT_READING_LEVELS } from '#lib/music/sightReadingLevels.ts';
import { checkSheet } from '#lib/music/voiceLeading.ts';
import { createEarQuestion, EAR_DEFAULTS, EAR_SUBMODULES } from './ear/questions';
import { createRhythmExercise, RHYTHM_DEFAULTS } from './rhythm/reading';
import { createExercise } from './sight-reading/exercise';
import { SIGHT_READING_DEFAULTS, type StaffChoice } from './sight-reading/prefs';
import { createQuestion, THEORY_DEFAULTS, THEORY_EXERCISES } from './theory/questions';

const SEEDS = Array.from({ length: 12 }, (_, i) => i * 7919 + 1);

describe('level tables', () => {
	it('define every level for every module', () => {
		for (const level of LEVELS) {
			expect(CLASSICAL_MAPPING[level]).toBeDefined();
			expect(JAZZ_MAPPING[level]).toBeDefined();
			expect(THEORY_LEVELS[level]).toBeDefined();
			expect(SIGHT_READING_LEVELS[level]).toBeDefined();
			expect(RHYTHM_READING_LEVELS[level]).toBeDefined();
		}
	});

	it('never get easier as the level rises', () => {
		const fifths = LEVELS.map((l) => SIGHT_READING_LEVELS[l].maxFifths);
		expect(fifths).toEqual([...fifths].sort((a, b) => a - b));
	});
});

describe.each(LEVELS)('level %i', (level) => {
	it.each(['treble', 'bass', 'grand'] satisfies StaffChoice[])(
		'sight reading on the %s staff fills every bar and scores every note',
		(staff) => {
			for (const seed of SEEDS) {
				const exercise = createExercise({ ...SIGHT_READING_DEFAULTS, level, staff }, seed);
				const perBar = measureTicks(exercise.meter);
				for (const part of exercise.parts) {
					expect(part.measures).toHaveLength(exercise.bars);
					part.measures.forEach((bar) => expect(totalTicks(bar)).toBe(perBar));
				}
				expect(exercise.expected.length).toBeGreaterThan(0);
				exercise.expected.forEach((note) => {
					expect(note.midi).toBeGreaterThanOrEqual(21);
					expect(note.midi).toBeLessThanOrEqual(108);
					expect(note.time).toBeLessThan(exercise.durationMs);
				});
			}
		}
	);

	it('rhythm reading fills every bar', () => {
		for (const seed of SEEDS) {
			const exercise = createRhythmExercise({ ...RHYTHM_DEFAULTS, level }, seed);
			const perBar = measureTicks(exercise.meter);
			exercise.measures.forEach((bar) => expect(totalTicks(bar)).toBe(perBar));
		}
	});

	it.each(THEORY_EXERCISES)('theory “%s” questions are well formed', (exercise) => {
		for (const seed of SEEDS) {
			const question = createQuestion({ ...THEORY_DEFAULTS, level, exercise }, seed);
			if (question.kind === 'voice-leading') {
				const model = question.model.map((voicing) => voicing.notes.map(toMidi));
				expect(checkSheet(question.entries, model)).toEqual([]);
				continue;
			}
			expect(new Set(question.options).size).toBe(question.options.length);
			if (question.kind === 'name-mode') expect(question.options).toContain(question.mode);
		}
	});

	it.each(EAR_SUBMODULES)('ear “%s” questions include their answer', (submodule) => {
		for (const seed of SEEDS) {
			const question = createEarQuestion({ ...EAR_DEFAULTS, level, submodule }, seed);
			switch (question.kind) {
				case 'modes':
					expect(question.options).toContain(question.mode);
					break;
				case 'progressions':
					question.answers.forEach((answer) => expect(question.options).toContain(answer));
					break;
				default:
					expect(question.options.map((o) => o.id)).toContain(question.answer);
			}
		}
	});
});
