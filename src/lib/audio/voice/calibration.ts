import { type Letter, LETTERS, type NoteNameSystem } from '#lib/music/pitch.ts';
import { byLetter, dtwDistance } from './names';
import type { VoiceProfile } from './profile';
import type { Syllable } from './syllables';

/**
 * Calibration: the student says each name on a click, a few times over. The recordings become
 * the templates the names are recognised by, and the delay from click to vowel becomes the
 * per-name offset that timing is corrected by (device latency plus how the name is articulated).
 */

export const CALIBRATION_ROUNDS = 3;
export const CALIBRATION_BEAT_MS = 1000;
const PAIRING_WINDOW_MS = CALIBRATION_BEAT_MS / 2;
const SAME_NAME_FACTOR = 2.5;
const OTHER_NAME_FACTOR = 2;

export const calibrationPrompts = (): Letter[] =>
	Array.from({ length: CALIBRATION_ROUNDS }, () => [...LETTERS]).flat();

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

/** Pairs each prompt with the syllable heard closest to its click, if close enough. */
export function pairPrompts(
	prompts: readonly Letter[],
	syllables: readonly TimedSyllable[]
): { letter: Letter; syllable: TimedSyllable; click: number }[] {
	const used = new Set<TimedSyllable>();
	return prompts.flatMap((letter, index) => {
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
		return [{ letter, syllable, click }];
	});
}

export function buildProfile(
	prompts: readonly Letter[],
	syllables: readonly TimedSyllable[],
	names: NoteNameSystem
): CalibrationResult {
	const pairs = pairPrompts(prompts, syllables);
	const heard = byLetter((letter) => pairs.filter((pair) => pair.letter === letter));
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
		profile: { names, offsetMs, templates, rejectDistance: rejectDistance(templates) }
	};
}

const nearest = (take: number[][], candidates: readonly number[][][]): number =>
	Math.min(...candidates.map((candidate) => dtwDistance(take, candidate)));

/**
 * How far a sound may sit from its nearest name and still count as one. A name sung at pitch,
 * held, or run into the next sits well beyond the calibration takes' spread, so the bound is
 * also measured against how far apart different names are.
 */
export function rejectDistance(templates: Record<Letter, number[][][]>): number {
	const sameName: number[] = [];
	const otherName: number[] = [];
	for (const letter of LETTERS) {
		const others = LETTERS.filter((other) => other !== letter).flatMap((other) => templates[other]);
		templates[letter].forEach((take, index) => {
			const repeats = templates[letter].filter((_, i) => i !== index);
			if (repeats.length > 0) sameName.push(nearest(take, repeats));
			if (others.length > 0) otherName.push(nearest(take, others));
		});
	}
	const bound = Math.max(
		Math.max(0, ...sameName) * SAME_NAME_FACTOR,
		otherName.length > 0 ? median(otherName) * OTHER_NAME_FACTOR : 0
	);
	return bound > 0 ? bound : Infinity;
}
