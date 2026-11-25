import { describe, expect, it } from 'vitest';
import { earChordById, voiceEarChord } from '#lib/music/earChords.ts';
import { LEVELS } from '#lib/music/levels.ts';
import { defaultVoicing } from '#lib/music/voicings.ts';
import { answerSound, questionSound } from './answerSound';
import {
	createEarQuestion,
	EAR_DEFAULTS,
	EAR_SUBMODULES,
	type IntervalQuestion,
	type ModeEarQuestion
} from './questions';

const interval = (notes: [number, number], harmonic = false): IntervalQuestion => ({
	kind: 'intervals',
	notes,
	harmonic,
	answer: String(Math.abs(notes[1] - notes[0])),
	options: []
});

describe('answerSound', () => {
	it('moves an interval from the same first note, in the same direction', () => {
		expect(answerSound(interval([60, 67]), '5')).toEqual({
			kind: 'interval',
			notes: [60, 65],
			harmonic: false
		});
		expect(answerSound(interval([67, 60]), '4')).toMatchObject({ notes: [67, 63] });
		expect(answerSound(interval([60, 64], true), '3')).toMatchObject({ harmonic: true });
	});

	it('voices the chosen chord quality the same way on the same root', () => {
		const question = createEarQuestion({ ...EAR_DEFAULTS, level: 3, submodule: 'chords' }, 4);
		if (question.kind !== 'chords') throw new Error('expected a chord question');
		const wrong = question.options.find((o) => o.id !== question.answer)!;
		expect(answerSound(question, wrong.id)).toEqual({
			kind: 'chord',
			root: question.root,
			midis: voiceEarChord(question.root, earChordById(wrong.id)!, question.voicing)
		});
		expect(answerSound(question, question.answer)).toEqual(questionSound(question));
	});

	it('plays the chosen mode over the same drone', () => {
		const question: ModeEarQuestion = {
			kind: 'modes',
			root: 62,
			scale: [62, 64, 65, 67, 69, 71, 72, 74],
			mode: 'major:2',
			options: []
		};
		expect(answerSound(question, 'major:2')).toEqual(questionSound(question));
		expect(answerSound(question, 'major:3')).toEqual({
			kind: 'scale',
			root: 62,
			scale: [62, 63, 65, 67, 69, 70, 72, 74]
		});
	});

	it('voices the same chord in the other voicing type', () => {
		for (let seed = 0; seed < 20; seed++) {
			const question = createEarQuestion(
				{ ...EAR_DEFAULTS, level: 2, submodule: 'voicings' },
				seed
			);
			if (question.kind !== 'voicings' || question.ask !== 'type' || !question.chord) continue;
			const other = question.answer === 'A' ? 'B' : 'A';
			expect(answerSound(question, other)).toMatchObject({
				midis: defaultVoicing(question.chord, other).midis
			});
			expect(answerSound(question, question.answer)).toMatchObject({ midis: question.midis });
		}
	});

	it('has nothing to play for answers it cannot build', () => {
		expect(answerSound(interval([60, 67]), 'x')).toBeNull();
		const progression = createEarQuestion({ ...EAR_DEFAULTS, submodule: 'progressions' }, 1);
		expect(answerSound(progression, 'II-7')).toBeNull();
		expect(questionSound(progression)).toBeNull();
	});

	it.each(LEVELS)('can sound every offered answer at level %i', (level) => {
		for (const submodule of EAR_SUBMODULES.filter((s) => s !== 'progressions')) {
			for (let seed = 0; seed < 6; seed++) {
				const question = createEarQuestion({ ...EAR_DEFAULTS, level, submodule }, seed);
				if (question.kind === 'voicings' && question.ask === 'top-note') continue;
				const ids =
					question.kind === 'modes'
						? question.options
						: 'options' in question
							? question.options.map((o) => (typeof o === 'string' ? o : o.id))
							: [];
				for (const id of ids)
					expect(answerSound(question, id), `${submodule} ${id}`).not.toBeNull();
			}
		}
	});
});
