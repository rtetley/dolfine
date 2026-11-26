import type { Level } from '#lib/music/levels.ts';
import { THEORY_CURRICULUM } from '#lib/progress/curriculum.ts';
import { LESSONS, type LessonId } from './lessons';
import type { TheoryExercise } from './questions';

/**
 * What a lesson is made of, in order. Each lesson is a page of its own: explanation, then examples
 * to see and hear, a section to go further, and the exercises that practise it.
 */
export type LessonSection =
	'intro' | 'harmonization' | 'modes' | 'voicings' | 'further' | 'exercises';

const SCALE_LESSON: readonly LessonSection[] = [
	'intro',
	'harmonization',
	'modes',
	'further',
	'exercises'
];

export const LESSON_PLANS: Record<LessonId, readonly LessonSection[]> = {
	major: SCALE_LESSON,
	'melodic-minor': SCALE_LESSON,
	'harmonic-minor': SCALE_LESSON,
	voicings: ['intro', 'voicings', 'further', 'exercises']
};

/** The theory level that first teaches a lesson: the lesson opens with that level. */
export function lessonLevel(lesson: LessonId): Level {
	const stage = Object.values(THEORY_CURRICULUM).find((candidate) => candidate.lesson === lesson);
	if (!stage) throw new Error(`No theory level teaches the ${lesson} lesson`);
	return stage.level;
}

/** Lessons in the order the levels reach them. */
export const LESSON_ORDER: readonly LessonId[] = [...LESSONS].sort(
	(a, b) => lessonLevel(a) - lessonLevel(b)
);

/** A lesson opens once the exercises of the lessons before it have their grade. */
export const isLessonOpen = (lesson: LessonId, unlocked: Level): boolean =>
	lessonLevel(lesson) <= unlocked;

/** The exercises of the level a lesson opens, to practise it right after reading. */
export const lessonExercises = (lesson: LessonId): readonly TheoryExercise[] =>
	THEORY_CURRICULUM[lessonLevel(lesson)].drills.map((drill) => drill.exercise);
