import {
	fromMidi,
	type Letter,
	type NoteNameSystem,
	noteName,
	pitchLabel
} from '#lib/music/pitch.ts';
import {
	type PlayedNote,
	type ScoredNote,
	type ScoreSummary,
	scorePerformance,
	scoreInOrder
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
		? scoreInOrder(
				exercise.expected,
				performance.notes,
				exercise.toleranceMs,
				(target, note) => target.letter === note.letter
			)
		: scorePerformance(exercise.expected, performance.notes, exercise.toleranceMs);

/**
 * What was heard in place of each wrong note, by note id: the name said, or the key played with
 * its octave, since a keyboard can be right on the letter and wrong on the octave.
 */
export function heardLabels(
	notes: readonly ScoredNote[],
	performance: Performance,
	names: NoteNameSystem,
	preferFlats: boolean
): Map<string, string> {
	const label = (index: number): string | undefined => {
		if (performance.input === 'voice') {
			const spoken = performance.notes[index];
			return spoken && noteName({ letter: spoken.letter, accidental: 0 }, names);
		}
		const played = performance.notes[index];
		return played && pitchLabel(fromMidi(played.midi, preferFlats), names);
	};
	return new Map(
		notes.flatMap((note) => {
			const text = note.heard === undefined ? undefined : label(note.heard);
			return text ? [[note.id, text] as const] : [];
		})
	);
}
