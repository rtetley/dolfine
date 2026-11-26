import type { Letter } from '#lib/music/pitch.ts';
import {
	type PlayedNote,
	type ScoreSummary,
	scorePerformance,
	scoreTimed
} from '#lib/music/scoring.ts';
import type { SightReadingExercise } from './exercise';

/** Spoken reading: the student says the note names; only the name and its timing are graded. */

export interface SpokenNote {
	letter: Letter;
	time: number;
}

export type Performance =
	{ input: 'midi'; notes: PlayedNote[] } | { input: 'voice'; notes: SpokenNote[] };

export const scoreRun = (
	exercise: Pick<SightReadingExercise, 'expected' | 'toleranceMs'>,
	performance: Performance
): ScoreSummary<PlayedNote> | ScoreSummary<SpokenNote> =>
	performance.input === 'voice'
		? scoreTimed(
				exercise.expected,
				performance.notes,
				exercise.toleranceMs,
				(target, note) => target.letter === note.letter
			)
		: scorePerformance(exercise.expected, performance.notes, exercise.toleranceMs);
