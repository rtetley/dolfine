import { type Letter, LETTERS, type NoteNameSystem } from '#lib/music/pitch.ts';
import { isRecord } from '#lib/state/persisted.ts';
import { byLetter, dtwDistance, type VoiceProfile } from './names';
import type { Syllable } from './syllables';

/**
 * Calibration: the student says each name on a click, a few times over. The recordings become
 * the templates the names are recognised by, and the delay from click to vowel becomes the
 * per-name offset that timing is corrected by (device latency plus how the name is articulated).
 */

export const CALIBRATION_ROUNDS = 3;
export const CALIBRATION_BEAT_MS = 1000;
const PAIRING_WINDOW_MS = CALIBRATION_BEAT_MS / 2;
/** How far beyond the furthest same-name pair a sound can still count as a note name. */
const REJECT_FACTOR = 2.5;

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

/** The furthest any recording sits from its nearest same-name recording, widened. */
export function rejectDistance(templates: Record<Letter, number[][][]>): number {
	let furthest = 0;
	for (const letter of LETTERS) {
		const takes = templates[letter];
		takes.forEach((take, index) => {
			const others = takes.filter((_, i) => i !== index);
			if (others.length === 0) return;
			furthest = Math.max(furthest, Math.min(...others.map((other) => dtwDistance(take, other))));
		});
	}
	return furthest > 0 ? furthest * REJECT_FACTOR : Infinity;
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
