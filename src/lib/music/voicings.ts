import { type ChordRef, chordTone, type ToneToken } from './chords';
import { type Pitch, placeAbove, placeAtOrAbove, toMidi } from './pitch';
import type { ModeId } from './scales';

export type VoicingType = 'A' | 'B';

export interface VoicingSpec {
	lh: readonly ToneToken[];
	rh: readonly ToneToken[];
	alternative: boolean;
}

export interface Voicing {
	type: VoicingType;
	chord: ChordRef;
	lh: Pitch[];
	rh: Pitch[];
	notes: Pitch[];
	midis: number[];
	tokens: ToneToken[];
}

const STANDARD: Record<VoicingType, Omit<VoicingSpec, 'alternative'>> = {
	A: { lh: [1, 7], rh: [3, 5, 9] },
	B: { lh: [1, 3, 7], rh: [9, 5] }
};

const SUS: Record<VoicingType, Omit<VoicingSpec, 'alternative'>> = {
	A: { lh: [1, 7], rh: [4, 5, 9] },
	B: { lh: [1, 4, 7], rh: [9, 5] }
};

const ELEVENTH: Record<VoicingType, Omit<VoicingSpec, 'alternative'>> = {
	A: { lh: [1, 7], rh: [3, 5, 11] },
	B: { lh: [1, 3, 7], rh: [5, 11] }
};

const ALTERED: Record<VoicingType, Omit<VoicingSpec, 'alternative'>> = {
	A: { lh: [1, 7], rh: [3, 13, 'sharp9'] },
	B: { lh: [1, 3, 7], rh: ['sharp9', 13] }
};

const DIMINISHED: Record<VoicingType, Omit<VoicingSpec, 'alternative'>> = {
	A: { lh: [1, 7], rh: [3, 5, 1] },
	B: { lh: [1, 3, 7], rh: [1, 5] }
};

const ALTERNATIVES: Partial<Record<ModeId, Record<VoicingType, Omit<VoicingSpec, 'alternative'>>>> =
	{
		'major:3': SUS,
		'melodicMinor:2': SUS,
		'major:7': ELEVENTH,
		'harmonicMinor:2': ELEVENTH,
		'melodicMinor:7': ALTERED,
		'harmonicMinor:7': DIMINISHED
	};

export function voicingSpec(mode: ModeId, type: VoicingType): VoicingSpec {
	const alternative = ALTERNATIVES[mode];
	return alternative
		? { ...alternative[type], alternative: true }
		: { ...STANDARD[type], alternative: false };
}

export const hasAlternativeVoicing = (mode: ModeId): boolean => mode in ALTERNATIVES;

export const LIMITS = {
	rhTop: 81,
	rhBottom: 55,
	lowestRoot: 40,
	highestRoot: 60
} as const;

const LOW_INTERVAL_LIMITS: Record<number, number> = {
	1: 52,
	2: 51,
	3: 48,
	4: 46,
	5: 46,
	6: 47,
	7: 34,
	8: 41,
	9: 41,
	10: 41,
	11: 41,
	13: 40,
	14: 39
};

export function lowIntervalViolations(midis: readonly number[]): number[] {
	const sorted = [...midis].sort((a, b) => a - b);
	const offending: number[] = [];
	for (let i = 0; i < sorted.length - 1; i++) {
		const lower = sorted[i];
		const limit = LOW_INTERVAL_LIMITS[sorted[i + 1] - lower];
		if (limit !== undefined && lower < limit) offending.push(i);
	}
	return offending;
}

export function realizeVoicing(chord: ChordRef, type: VoicingType, rootMidiFloor: number): Voicing {
	const spec = voicingSpec(chord.mode, type);
	const root = placeAtOrAbove(chord.root, rootMidiFloor);
	const lh: Pitch[] = [root];
	let previous = toMidi(root);
	for (const token of spec.lh.slice(1)) {
		const pitch = placeAbove(chordTone(chord, token).name, previous);
		lh.push(pitch);
		previous = toMidi(pitch);
	}
	const rh: Pitch[] = [];
	for (const token of spec.rh) {
		const pitch = placeAbove(chordTone(chord, token).name, previous);
		rh.push(pitch);
		previous = toMidi(pitch);
	}
	const notes = [...lh, ...rh];
	return {
		type,
		chord,
		lh,
		rh,
		notes,
		midis: notes.map(toMidi),
		tokens: [...spec.lh, ...spec.rh]
	};
}

export type RangeProblem = 'rh-too-high' | 'rh-too-low' | 'root-too-low' | 'low-interval-limit';

export function rangeProblems(voicing: Pick<Voicing, 'lh' | 'rh' | 'midis'>): RangeProblem[] {
	const problems: RangeProblem[] = [];
	const rhMidis = voicing.rh.map(toMidi);
	const root = voicing.lh[0];
	if (rhMidis.some((midi) => midi > LIMITS.rhTop)) problems.push('rh-too-high');
	if (rhMidis.some((midi) => midi < LIMITS.rhBottom)) problems.push('rh-too-low');
	if (root && toMidi(root) < LIMITS.lowestRoot) problems.push('root-too-low');
	if (lowIntervalViolations(voicing.midis).length > 0) problems.push('low-interval-limit');
	return problems;
}

export function candidateVoicings(chord: ChordRef, type: VoicingType): Voicing[] {
	const seen = new Set<string>();
	const candidates: Voicing[] = [];
	for (let floor = LIMITS.lowestRoot; floor <= LIMITS.highestRoot; floor++) {
		const voicing = realizeVoicing(chord, type, floor);
		const key = voicing.midis.join(',');
		if (seen.has(key)) continue;
		seen.add(key);
		if (rangeProblems(voicing).length === 0) candidates.push(voicing);
	}
	return candidates;
}

export function defaultVoicing(chord: ChordRef, type: VoicingType): Voicing {
	const candidates = candidateVoicings(chord, type);
	const middle = candidates[Math.floor((candidates.length - 1) / 2)];
	return middle ?? realizeVoicing(chord, type, 48);
}
