import { type Letter, LETTERS, type NoteNameSystem } from '#lib/music/pitch.ts';
import { isRecord } from '#lib/state/persisted.ts';

/** What calibration learns about one student's voice on one device. */
export interface VoiceProfile {
	names: NoteNameSystem;
	/** Delay from a click to the student's vowel for each name: device latency plus articulation. */
	offsetMs: Record<Letter, number>;
	templates: Record<Letter, number[][][]>;
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
		(value.names === 'letters' || value.names === 'solfege') &&
		typeof value.rejectDistance === 'number' &&
		LETTERS.every(
			(letter) =>
				typeof offsetMs[letter] === 'number' &&
				isNumberGrid(templates[letter]) &&
				templates[letter].length > 0
		)
	);
}
