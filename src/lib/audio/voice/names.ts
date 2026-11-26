import { type Letter, LETTERS } from '#lib/music/pitch.ts';
import type { VoiceProfile } from './profile';

/**
 * Tells which of the seven note names a syllable is, by comparing it with the student's own
 * recordings from calibration (dynamic time warping over MFCCs). A sound closer to one of the
 * student's made-up decoy syllables than to any name is not a name. The score says which name is
 * due, so a near tie goes to the expected name, a mumbled consonant not being a misread; but only
 * if the sound is closer to that name than to every decoy, so nonsense said on time doesn't pass.
 */

export type Features = readonly ArrayLike<number>[];

/**
 * Only the broad shape of the spectrum is compared. The finer cepstra follow the spacing of the
 * voice's harmonics, so they shift when a name is sung higher than it was said in calibration.
 */
const SHAPE_CEPSTRA = 7;
const PRIOR_MARGIN = 1.15;
/** To count as the name the score expects, a sound must be closer to it than to just any name. */
const PRIOR_BOUND = 0.8;

function frameDistance(a: ArrayLike<number>, b: ArrayLike<number>): number {
	let sum = 0;
	for (let i = 0; i < Math.min(a.length, SHAPE_CEPSTRA); i++) sum += (a[i] - b[i]) ** 2;
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
	profile: Pick<VoiceProfile, 'templates' | 'decoys' | 'rejectDistance'>,
	expected?: Letter
): Heard | null {
	const distances = distancesTo(features, profile.templates);
	const decoy = Math.min(...profile.decoys.map((take) => dtwDistance(features, take)));
	const best = LETTERS.reduce((a, b) => (distances[b] < distances[a] ? b : a));
	if (distances[best] > profile.rejectDistance || decoy <= distances[best]) return null;
	if (
		expected &&
		distances[expected] <= distances[best] * PRIOR_MARGIN &&
		distances[expected] <= profile.rejectDistance * PRIOR_BOUND &&
		distances[expected] < decoy
	) {
		return { letter: expected, distance: distances[expected] };
	}
	return { letter: best, distance: distances[best] };
}
