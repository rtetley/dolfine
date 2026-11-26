import type { EarSubmodule } from '#lib/modules/ear/questions.ts';
import type { LessonId } from '#lib/modules/theory/lessons.ts';

/** The theory lessons behind each ear-training sub-module. */
export const EAR_LESSONS: Record<EarSubmodule, readonly LessonId[]> = {
	intervals: [],
	chords: ['voicings', 'major'],
	voicings: ['voicings'],
	modes: ['major', 'melodic-minor', 'harmonic-minor'],
	progressions: ['major', 'harmonic-minor'],
	colours: ['chord-colours', 'four-colours']
};
