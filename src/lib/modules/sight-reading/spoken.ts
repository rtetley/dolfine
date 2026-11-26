import type { Recording } from '#lib/audio/voice/microphone.ts';
import { classify, type VoiceProfile } from '#lib/audio/voice/names.ts';
import { findSyllables, type Syllable } from '#lib/audio/voice/syllables.ts';
import { type Letter, LETTERS } from '#lib/music/pitch.ts';
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

const NEAREST_NOTE_MS = 600;

const meanOffset = (profile: VoiceProfile): number =>
	LETTERS.reduce((sum, letter) => sum + profile.offsetMs[letter], 0) / LETTERS.length;

/**
 * Names each syllable and places it on the exercise's clock. The note due nearest in time is the
 * prior for the name; the name's own calibrated offset then corrects the timing.
 */
export function hearSyllables(
	syllables: readonly Syllable[],
	recordingStartMs: number,
	exercise: Pick<SightReadingExercise, 'expected'>,
	profile: VoiceProfile
): SpokenNote[] {
	const shift = meanOffset(profile);
	return syllables.flatMap((syllable) => {
		const heardAt = recordingStartMs + syllable.time * 1000;
		const due = exercise.expected.reduce<{ letter: Letter; gap: number } | null>((best, note) => {
			const gap = Math.abs(note.time - (heardAt - shift));
			return gap <= NEAREST_NOTE_MS && (!best || gap < best.gap)
				? { letter: note.letter, gap }
				: best;
		}, null);
		const heard = classify(syllable.features, profile, due?.letter);
		return heard ? [{ letter: heard.letter, time: heardAt - profile.offsetMs[heard.letter] }] : [];
	});
}

/** `readingStart` is the AudioContext time of the first beat after the count-in. */
export const hearReading = (
	recording: Recording,
	readingStart: number,
	exercise: Pick<SightReadingExercise, 'expected'>,
	profile: VoiceProfile
): SpokenNote[] =>
	hearSyllables(
		findSyllables(recording.samples, recording.sampleRate),
		(recording.startTime - readingStart) * 1000,
		exercise,
		profile
	);

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
