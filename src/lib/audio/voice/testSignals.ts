import type { Letter } from '#lib/music/pitch.ts';
import { calibrationPrompts, CALIBRATION_BEAT_MS, type TimedSyllable } from './calibration';
import { findSyllables } from './syllables';

/**
 * Synthetic "syllables" for tests: a harmonic tone shaped by two formants, like a sung vowel.
 * Consonants are added before or after the vowel, as in the note names.
 */

export const RATE = 16_000;

export const VOWELS = {
	a: [730, 1090],
	e: [530, 1840],
	i: [270, 2290],
	o: [570, 840],
	oh: [400, 780],
	u: [300, 870],
	y: [250, 1750],
	oe: [460, 1300]
} as const satisfies Record<string, readonly [number, number]>;

export type Vowel = keyof typeof VOWELS;

/** Voiced consonants have formants of their own; unvoiced ones are noise. */
const CONSONANTS = {
	l: { formants: [360, 1250], gain: 0.4, duration: 0.06 },
	m: { formants: [250, 1200], gain: 0.25, duration: 0.06 },
	r: { formants: [500, 1400], gain: 0.35, duration: 0.05 },
	d: { formants: [250, 1900], gain: 0.1, duration: 0.03 },
	f: { noise: 0.01, highPass: false, duration: 0.07 },
	s: { noise: 0.05, highPass: true, duration: 0.09 }
} as const satisfies Record<
	string,
	| { formants: readonly number[]; gain: number; duration: number }
	| { noise: number; highPass: boolean; duration: number }
>;

export type Consonant = keyof typeof CONSONANTS;

/** How long a consonant overlaps the vowel next to it, so a voiced one runs on without a dip. */
const COARTICULATION = 0.02;

export interface Spoken {
	vowel: Vowel;
	/** When the vowel starts: a leading consonant comes just before. */
	at: number;
	duration?: number;
	f0?: number;
	gain?: number;
	onset?: Consonant;
	coda?: Consonant;
}

function formantGain(frequency: number, formants: readonly number[]): number {
	return formants.reduce(
		(sum, formant) => sum + Math.exp(-(((frequency - formant) / 120) ** 2)),
		0
	);
}

interface Span {
	start: number;
	length: number;
	gain: number;
}

function addVoiced(
	out: Float32Array,
	formants: readonly number[],
	f0: number,
	{ start, length, gain }: Span,
	rate: number
): void {
	const harmonics = Array.from({ length: Math.floor(4000 / f0) }, (_, k) => (k + 1) * f0);
	const weights = harmonics.map((h) => formantGain(h, formants));
	const total = weights.reduce((a, b) => a + b, 0) || 1;
	const duration = length / rate;
	for (let n = 0; n < length && start + n < out.length; n++) {
		if (start + n < 0) continue;
		const t = n / rate;
		const envelope = Math.min(1, t / 0.01, (duration - t) / 0.01 / 3);
		let value = 0;
		harmonics.forEach((h, k) => (value += weights[k] * Math.sin(2 * Math.PI * h * t)));
		out[start + n] += (gain * envelope * value) / total;
	}
}

function addNoise(out: Float32Array, highPass: boolean, { start, length, gain }: Span): void {
	let seed = 11 + start;
	let previous = 0;
	for (let n = 0; n < length && start + n < out.length; n++) {
		seed = (seed * 16807) % 2147483647;
		const white = seed / 2147483647 - 0.5;
		if (start + n >= 0) out[start + n] += gain * (highPass ? white - previous : white);
		previous = white;
	}
}

function addConsonant(
	out: Float32Array,
	consonant: Consonant,
	start: number,
	f0: number,
	gain: number,
	rate: number
): void {
	const sound = CONSONANTS[consonant];
	const length = Math.round((sound.duration + COARTICULATION) * rate);
	if ('formants' in sound) {
		addVoiced(out, sound.formants, f0, { start, length, gain: gain * sound.gain }, rate);
	} else {
		addNoise(out, sound.highPass, { start, length, gain: (gain / 0.3) * sound.noise });
	}
}

/** A recording of `seconds` with each syllable mixed in at its time, over faint noise. */
export function speak(seconds: number, syllables: readonly Spoken[], rate = RATE): Float32Array {
	const out = new Float32Array(Math.round(seconds * rate));
	let seed = 7;
	for (let i = 0; i < out.length; i++) {
		seed = (seed * 16807) % 2147483647;
		out[i] = (seed / 2147483647 - 0.5) * 0.002;
	}
	for (const { vowel, at, duration = 0.18, f0 = 140, gain = 0.3, onset, coda } of syllables) {
		const start = Math.round(at * rate);
		const length = Math.round(duration * rate);
		if (onset) {
			const lead = Math.round(CONSONANTS[onset].duration * rate);
			addConsonant(out, onset, start - lead, f0, gain, rate);
		}
		addVoiced(out, VOWELS[vowel], f0, { start, length, gain }, rate);
		if (coda)
			addConsonant(out, coda, start + length - Math.round(COARTICULATION * rate), f0, gain, rate);
	}
	return out;
}

export type NameSound = Pick<Spoken, 'vowel' | 'onset' | 'coda'>;

/**
 * French solfège as tests hear it. Like the real names, fa and la, mi and si, and do and sol
 * share or nearly share a vowel, so only their consonants tell them apart.
 */
export const NAME_SOUNDS = {
	C: { onset: 'd', vowel: 'oh' },
	D: { onset: 'r', vowel: 'e' },
	E: { onset: 'm', vowel: 'i' },
	F: { onset: 'f', vowel: 'a' },
	G: { onset: 's', vowel: 'o', coda: 'l' },
	A: { onset: 'l', vowel: 'a' },
	B: { onset: 's', vowel: 'i' }
} as const satisfies Record<Letter, NameSound>;

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
			...NAME_SOUNDS[letter],
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
