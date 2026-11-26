import { describe, expect, it } from 'vitest';
import { LESSONS } from './lessons';
import {
	isLessonOpen,
	LESSON_ORDER,
	LESSON_PLANS,
	lessonExercises,
	lessonLevel
} from './lessonPlan';

describe('lesson plans', () => {
	it('explain, show and hear, go further, then practise', () => {
		for (const lesson of LESSONS) {
			const plan = LESSON_PLANS[lesson];
			expect(plan[0]).toBe('intro');
			expect(plan.slice(-2)).toEqual(['further', 'exercises']);
		}
		expect(LESSON_PLANS.major).toEqual(['intro', 'harmonization', 'modes', 'further', 'exercises']);
	});

	it('open with the level that first teaches them, in that order', () => {
		expect(LESSON_ORDER).toEqual(['major', 'voicings', 'melodic-minor', 'harmonic-minor']);
		expect(lessonLevel('major')).toBe(1);
		expect(isLessonOpen('major', 1)).toBe(true);
		expect(isLessonOpen('voicings', 1)).toBe(false);
		expect(isLessonOpen('voicings', 2)).toBe(true);
		expect(isLessonOpen('harmonic-minor', 7)).toBe(false);
	});

	it('point to the exercises of their level', () => {
		expect(lessonExercises('major')).toEqual(['name-mode', 'write-mode']);
		expect(lessonExercises('voicings')).toContain('build-chord');
	});
});
