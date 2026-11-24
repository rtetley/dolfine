import { describe, expect, it } from 'vitest';
import { createEarQuestion, EAR_DEFAULTS, EAR_SUBMODULES, samePitchClasses } from './questions';

describe('ear questions', () => {
	it.each(EAR_SUBMODULES)(
		'creates %s questions at every level with the answer among the options',
		(submodule) => {
			for (let level = 1; level <= 10; level++) {
				for (let seed = 0; seed < 5; seed++) {
					const question = createEarQuestion(
						{ ...EAR_DEFAULTS, submodule, level: level as 1 },
						seed * 31 + level
					);
					if (question.kind === 'modes') expect(question.options).toContain(question.mode);
					else if (question.kind === 'progressions')
						question.answers.forEach((a) => expect(question.options).toContain(a));
					else expect(question.options.map((o) => o.id)).toContain(question.answer);
				}
			}
		}
	);

	it('voices chords with the root in the bass', () => {
		for (let seed = 0; seed < 20; seed++) {
			const question = createEarQuestion({ ...EAR_DEFAULTS, submodule: 'chords', level: 5 }, seed);
			if (question.kind !== 'chords') throw new Error('wrong kind');
			expect(Math.min(...question.midis) % 12).toBe(question.root % 12);
		}
	});

	it('compares pitch classes regardless of octave', () => {
		expect(samePitchClasses([48, 52, 55], [64, 67, 72])).toBe(true);
		expect(samePitchClasses([48, 52], [48, 53])).toBe(false);
	});
});
