import { type Letter, LETTERS } from '#lib/music/pitch.ts';
import type { NoteNameSystem } from '#lib/music/pitch.ts';

/**
 * Tells which of the seven note names a syllable is, by comparing it with the student's own
 * recordings from calibration (dynamic time warping over MFCCs). The score says which name is
 * due, so a near tie goes to the expected name: a mumbled consonant is not a misread.
 */

export type Features = readonly ArrayLike<number>[];

export interface VoiceProfile {
	names: NoteNameSystem;
	/** Delay from a click to the student's vowel for each name: device latency plus articulation. */
	offsetMs: Record<Letter, number>;
	templates: Record<Letter, number[][][]>;
	/** Above this distance a sound is not a note name at all (a cough, a click, a word). */
	rejectDistance: number;
}

const PRIOR_MARGIN = 1.15;

function frameDistance(a: ArrayLike<number>, b: ArrayLike<number>): number {
	let sum = 0;
	for (let i = 0; i < a.length; i++) sum += (a[i] - b[i]) ** 2;
	return Math.sqrt(sum);
}

/** DTW cost of the best alignment, per step, so long and short syllables compare fairly. */
export function dtwDistance(a: Features, b: Features): number {
	if (a.length === 0 || b.length === 0) return Infinity;
	let previous = new Float64Array(b.length + 1).fill(Infinity);
	previous[0] = 0;
	for (let i = 1; i <= a.length; i++) {
		const row = new Float64Array(b.length + 1).fill(Infinity);
		for (let j = 1; j <= b.length; j++) {
			const step = Math.min(previous[j], row[j - 1], previous[j - 1]);
			row[j] = frameDistance(a[i - 1], b[j - 1]) + step;
		}
		previous = row;
	}
	return previous[b.length] / (a.length + b.length);
}

export const byLetter = <T>(make: (letter: Letter) => T): Record<Letter, T> => ({
	C: make('C'),
	D: make('D'),
	E: make('E'),
	F: make('F'),
	G: make('G'),
	A: make('A'),
	B: make('B')
});

export const distancesTo = (
	features: Features,
	templates: Record<Letter, readonly Features[]>
): Record<Letter, number> =>
	byLetter((letter) =>
		Math.min(...templates[letter].map((template) => dtwDistance(features, template)))
	);

export interface Heard {
	letter: Letter;
	distance: number;
}

export function classify(
	features: Features,
	profile: Pick<VoiceProfile, 'templates' | 'rejectDistance'>,
	expected?: Letter
): Heard | null {
	const distances = distancesTo(features, profile.templates);
	const best = LETTERS.reduce((a, b) => (distances[b] < distances[a] ? b : a));
	if (distances[best] > profile.rejectDistance) return null;
	if (expected && distances[expected] <= distances[best] * PRIOR_MARGIN) {
		return { letter: expected, distance: distances[expected] };
	}
	return { letter: best, distance: distances[best] };
}
