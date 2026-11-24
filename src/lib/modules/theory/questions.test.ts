import { describe, expect, it } from 'vitest';
import { pitchClassOf, toMidi } from '#lib/music/pitch.ts';
import { checkSheet } from '#lib/music/voiceLeading.ts';
import {
	checkBuiltChord,
	checkParentAnswer,
	checkWrittenScale,
	createQuestion,
	type ModeQuestion,
	THEORY_DEFAULTS,
	THEORY_EXERCISES
} from './questions';

describe('theory questions', () => {
	it.each(THEORY_EXERCISES)('creates a %s question for every level', (exercise) => {
		for (let level = 1; level <= 10; level++) {
			expect(() =>
				createQuestion({ ...THEORY_DEFAULTS, exercise, level: level as 1 }, level * 13)
			).not.toThrow();
		}
	});

	it('always offers the correct mode among the choices', () => {
		for (let seed = 0; seed < 25; seed++) {
			const question = createQuestion({ ...THEORY_DEFAULTS, level: 6 }, seed) as ModeQuestion;
			expect(question.options).toContain(question.mode);
			expect(new Set(question.options).size).toBe(question.options.length);
		}
	});

	it('produces voice-leading sheets whose model answer passes the checker', () => {
		for (let seed = 0; seed < 15; seed++) {
			const question = createQuestion(
				{ ...THEORY_DEFAULTS, exercise: 'voice-leading', level: 8 },
				seed
			);
			if (question.kind !== 'voice-leading') throw new Error('wrong kind');
			expect(
				checkSheet(
					question.entries,
					question.model.map((v) => v.midis)
				)
			).toEqual([]);
		}
	});

	it('checks a written scale', () => {
		const question = createQuestion(
			{ ...THEORY_DEFAULTS, exercise: 'write-mode' },
			5
		) as ModeQuestion;
		const midis = question.notes.map(toMidi);
		expect(checkWrittenScale(question, midis).ok).toBe(true);
		expect(checkWrittenScale(question, midis.slice(0, 6)).ok).toBe(false);
	});

	it('checks the parent scale', () => {
		const question = createQuestion(
			{ ...THEORY_DEFAULTS, exercise: 'name-mode', level: 6 },
			9
		) as ModeQuestion;
		const parent = question.mode.split(':')[0] as 'major';
		const rootPc = pitchClassOf(question.parentRoot);
		expect(checkParentAnswer(question, parent, rootPc)).toBe(true);
		expect(checkParentAnswer(question, parent, (rootPc + 1) % 12)).toBe(false);
	});

	it('checks a built chord in any octave', () => {
		const chord = { root: { letter: 'D', accidental: 0 }, mode: 'major:2' } as const;
		expect(checkBuiltChord(chord, [50, 53, 57, 60]).ok).toBe(true);
		expect(checkBuiltChord(chord, [62, 65, 69, 72, 74]).ok).toBe(true);
		expect(checkBuiltChord(chord, [50, 54, 57, 60]).ok).toBe(false);
	});
});
