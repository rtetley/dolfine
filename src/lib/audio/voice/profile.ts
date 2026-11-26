import { type Letter, LETTERS, type NoteNameSystem } from '#lib/music/pitch.ts';
import { isRecord } from '#lib/state/persisted.ts';

/** Bumped whenever recognition changes what a template holds, so older set-ups are redone. */
export const PROFILE_VERSION = 3;

/** What calibration learns about one student's voice on one device. */
export interface VoiceProfile {
	version: typeof PROFILE_VERSION;
	names: NoteNameSystem;
	/** Delay from a click to the student's vowel for each name: device latency plus articulation. */
	offsetMs: Record<Letter, number>;
	templates: Record<Letter, number[][][]>;
	/** Made-up syllables the student said: what a sound closer to them than to a name is. */
	decoys: number[][][];
	/** Above this distance a sound is not a note name at all (a cough, a click, a word). */
	rejectDistance: number;
}

const isNumberGrid = (value: unknown): value is number[][][] =>
	Array.isArray(value) &&
	value.every(
		(take) =>
			Array.isArray(take) &&
			take.every((frame) => Array.isArray(frame) && frame.every((cell) => typeof cell === 'number'))
	);

export function isVoiceProfile(value: unknown): value is VoiceProfile {
	if (!isRecord(value) || !isRecord(value.offsetMs) || !isRecord(value.templates)) return false;
	const { offsetMs, templates } = value;
	return (
		value.version === PROFILE_VERSION &&
		(value.names === 'letters' || value.names === 'solfege') &&
		typeof value.rejectDistance === 'number' &&
		isNumberGrid(value.decoys) &&
		LETTERS.every(
			(letter) =>
				typeof offsetMs[letter] === 'number' &&
				isNumberGrid(templates[letter]) &&
				templates[letter].length > 0
		)
	);
}
