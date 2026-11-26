import type { Letter } from '#lib/music/pitch.ts';
import { calibrationPrompts, CALIBRATION_BEAT_MS, type TimedSyllable } from './calibration';
import { findSyllables } from './syllables';

/**
 * Synthetic "syllables" for tests: a harmonic tone shaped by two formants, like a sung vowel.
 * Different formant pairs stand in for different note names.
 */

export const RATE = 16_000;

export const VOWELS = {
	a: [730, 1090],
	e: [530, 1840],
	i: [270, 2290],
	o: [570, 840],
	u: [300, 870],
	y: [250, 1750],
	oe: [460, 1300]
} as const satisfies Record<string, readonly [number, number]>;

export type Vowel = keyof typeof VOWELS;

export interface Spoken {
	vowel: Vowel;
	at: number;
	duration?: number;
	f0?: number;
	gain?: number;
}

function formantGain(frequency: number, formants: readonly number[]): number {
	return formants.reduce(
		(sum, formant) => sum + Math.exp(-(((frequency - formant) / 120) ** 2)),
		0
	);
}

/** A recording of `seconds` with each syllable mixed in at its time, over faint noise. */
export function speak(seconds: number, syllables: readonly Spoken[], rate = RATE): Float32Array {
	const out = new Float32Array(Math.round(seconds * rate));
	let seed = 7;
	for (let i = 0; i < out.length; i++) {
		seed = (seed * 16807) % 2147483647;
		out[i] = (seed / 2147483647 - 0.5) * 0.002;
	}
	for (const { vowel, at, duration = 0.18, f0 = 140, gain = 0.3 } of syllables) {
		const formants = VOWELS[vowel];
		const harmonics = Array.from({ length: Math.floor(4000 / f0) }, (_, k) => (k + 1) * f0);
		const weights = harmonics.map((h) => formantGain(h, formants));
		const total = weights.reduce((a, b) => a + b, 0) || 1;
		const start = Math.round(at * rate);
		const length = Math.round(duration * rate);
		for (let n = 0; n < length && start + n < out.length; n++) {
			const t = n / rate;
			const envelope = Math.min(1, t / 0.01, (duration - t) / 0.03);
			let value = 0;
			harmonics.forEach((h, k) => (value += weights[k] * Math.sin(2 * Math.PI * h * t)));
			out[start + n] += (gain * envelope * value) / total;
		}
	}
	return out;
}

/** Which vowel stands in for each note name in tests. */
export const NAME_VOWELS = {
	C: 'o',
	D: 'e',
	E: 'i',
	F: 'a',
	G: 'oe',
	A: 'y',
	B: 'u'
} as const satisfies Record<Letter, Vowel>;

/** A calibration take: every name on its click, three rounds, `latency` seconds late. */
export function calibrationTake(
	latency: number,
	f0 = 140
): { prompts: Letter[]; syllables: TimedSyllable[] } {
	const prompts = calibrationPrompts();
	const lead = 0.5;
	const audio = speak(
		lead + (prompts.length * CALIBRATION_BEAT_MS) / 1000 + 0.5,
		prompts.map((letter, i) => ({
			vowel: NAME_VOWELS[letter],
			at: lead + (i * CALIBRATION_BEAT_MS) / 1000 + latency,
			f0: f0 + (i % 3) * 6
		}))
	);
	const syllables = findSyllables(audio, RATE).map((syllable) => ({
		...syllable,
		ms: (syllable.time - lead) * 1000
	}));
	return { prompts, syllables };
}
