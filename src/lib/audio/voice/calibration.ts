import { type Letter, LETTERS, type NoteNameSystem } from '#lib/music/pitch.ts';
import { byLetter, dtwDistance } from './names';
import { PROFILE_VERSION, type VoiceProfile } from './profile';
import type { Syllable } from './syllables';

/**
 * Calibration: the student says each name on a click, a few times over, then a few made-up
 * syllables. The names become the templates they are recognised by, and the delay from click to
 * vowel becomes the per-name offset that timing is corrected by (device latency plus how the name
 * is articulated). The made-up syllables are decoys: examples of what is not a name, so a
 * nonsense sound is turned away instead of counting as whichever name it is least unlike.
 */

export const CALIBRATION_ROUNDS = 3;
export const CALIBRATION_BEAT_MS = 1000;
const PAIRING_WINDOW_MS = CALIBRATION_BEAT_MS / 2;
const SAME_NAME_FACTOR = 3;

export type CalibrationPrompt = { kind: 'name'; letter: Letter } | { kind: 'decoy'; text: string };

/** Short syllables that share sounds with the names without being one; seven, one bar's worth. */
export const DECOYS: Record<NoteNameSystem, readonly string[]> = {
	solfege: ['ma', 'nu', 'to', 'ku', 'gou', 'zo', 'pi'],
	letters: ['ma', 'noo', 'toe', 'koo', 'goo', 'zo', 'pie']
};

export const calibrationPrompts = (names: NoteNameSystem): CalibrationPrompt[] => [
	...Array.from({ length: CALIBRATION_ROUNDS }, () =>
		LETTERS.map((letter): CalibrationPrompt => ({ kind: 'name', letter }))
	).flat(),
	...DECOYS[names].map((text): CalibrationPrompt => ({ kind: 'decoy', text }))
];

export interface TimedSyllable extends Syllable {
	/** Milliseconds from the first prompt's click. */
	ms: number;
}

export type CalibrationResult =
	{ ok: true; profile: VoiceProfile } | { ok: false; missing: Letter[] };

const median = (values: readonly number[]): number => {
	const sorted = [...values].sort((a, b) => a - b);
	const middle = Math.floor(sorted.length / 2);
	return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

const rounded = (features: Syllable['features']): number[][] =>
	features.map((frame) => Array.from(frame, (value) => Math.round(value * 1000) / 1000));

interface Pair {
	prompt: CalibrationPrompt;
	syllable: TimedSyllable;
	click: number;
}

/** Pairs each prompt with the syllable heard closest to its click, if close enough. */
export function pairPrompts(
	prompts: readonly CalibrationPrompt[],
	syllables: readonly TimedSyllable[]
): Pair[] {
	const used = new Set<TimedSyllable>();
	return prompts.flatMap((prompt, index) => {
		const click = index * CALIBRATION_BEAT_MS;
		const candidates = syllables.filter(
			(syllable) =>
				!used.has(syllable) &&
				syllable.ms >= click - PAIRING_WINDOW_MS / 2 &&
				syllable.ms < click + PAIRING_WINDOW_MS
		);
		const syllable = candidates.sort((a, b) => Math.abs(a.ms - click) - Math.abs(b.ms - click))[0];
		if (!syllable) return [];
		used.add(syllable);
		return [{ prompt, syllable, click }];
	});
}

export function buildProfile(
	prompts: readonly CalibrationPrompt[],
	syllables: readonly TimedSyllable[],
	names: NoteNameSystem
): CalibrationResult {
	const pairs = pairPrompts(prompts, syllables);
	const heard = byLetter((letter) =>
		pairs.filter(({ prompt }) => prompt.kind === 'name' && prompt.letter === letter)
	);
	const missing = LETTERS.filter((letter) => heard[letter].length === 0);
	if (missing.length > 0) return { ok: false, missing };

	const templates = byLetter((letter) =>
		heard[letter].map(({ syllable }) => rounded(syllable.features))
	);
	const offsetMs = byLetter((letter) =>
		Math.round(median(heard[letter].map(({ syllable, click }) => syllable.ms - click)))
	);
	return {
		ok: true,
		profile: {
			version: PROFILE_VERSION,
			names,
			offsetMs,
			templates,
			decoys: pairs
				.filter(({ prompt }) => prompt.kind === 'decoy')
				.map(({ syllable }) => rounded(syllable.features)),
			rejectDistance: rejectDistance(templates)
		}
	};
}

const nearest = (take: number[][], candidates: readonly number[][][]): number =>
	Math.min(...candidates.map((candidate) => dtwDistance(take, candidate)));

/**
 * How far a sound may sit from its nearest name and still count as one: a few times the distance
 * between the student's own repeats of a name. Names are compared on a fixed window around the
 * vowel onset, so a name held or sung at pitch stays close to its takes; nonsense doesn't.
 */
export function rejectDistance(templates: Record<Letter, number[][][]>): number {
	const repeats = LETTERS.flatMap((letter) =>
		templates[letter].flatMap((take, index) => {
			const others = templates[letter].filter((_, i) => i !== index);
			return others.length > 0 ? [nearest(take, others)] : [];
		})
	);
	const spread = repeats.length > 0 ? median(repeats) : 0;
	return spread > 0 ? spread * SAME_NAME_FACTOR : Infinity;
}
