import { m } from '#lib/i18n.ts';
import type { ChordRef } from './chords';
import { type Interval, type PitchClassName, transpose } from './pitch';
import type { Rng } from './random';
import { type Degree, degreeRoot, modeId, type ParentScale, ROMAN } from './scales';

export const PROGRESSION_KINDS = [
	'ii-v-i-major',
	'ii-v-i-minor',
	'turnaround',
	'modal-vamp',
	'blues'
] as const;
export type ProgressionKind = (typeof PROGRESSION_KINDS)[number];

export const PROGRESSION_LABELS: Record<ProgressionKind, string> = {
	get 'ii-v-i-major'() {
		return m.progression_ii_v_i_major();
	},
	get 'ii-v-i-minor'() {
		return m.progression_ii_v_i_minor();
	},
	get turnaround() {
		return m.progression_turnaround();
	},
	get 'modal-vamp'() {
		return m.progression_modal_vamp();
	},
	get blues() {
		return m.progression_blues();
	}
};

interface TemplateChord {
	parent: ParentScale;
	degree: Degree;
	parentOffset: Interval;
	roman: string;
}

const UNISON: Interval = { steps: 0, semitones: 0 };
const FOURTH: Interval = { steps: 3, semitones: 5 };
const MINOR_SEVENTH: Interval = { steps: 6, semitones: 10 };

const chord = (
	parent: ParentScale,
	degree: Degree,
	roman: string,
	parentOffset = UNISON
): TemplateChord => ({
	parent,
	degree,
	parentOffset,
	roman
});

const I7 = chord('major', 5, 'I7', FOURTH);
const IV7 = chord('major', 5, 'IV7', MINOR_SEVENTH);
const V7 = chord('major', 5, 'V7');
const ii = chord('major', 2, 'II-7');

const TEMPLATES: Record<Exclude<ProgressionKind, 'modal-vamp'>, readonly TemplateChord[]> = {
	'ii-v-i-major': [ii, V7, chord('major', 1, 'IΔ7')],
	'ii-v-i-minor': [
		chord('harmonicMinor', 2, 'IIø7'),
		chord('harmonicMinor', 5, 'V7(♭9 ♭13)'),
		chord('melodicMinor', 1, 'I-Δ7')
	],
	turnaround: [chord('major', 1, 'IΔ7'), chord('major', 6, 'VI-7'), ii, V7],
	blues: [I7, IV7, I7, I7, IV7, IV7, I7, I7, ii, V7, I7, V7]
};

const DORIAN_PARENT: Interval = { steps: -1, semitones: -2 };
const LYDIAN_PARENT: Interval = { steps: -3, semitones: -5 };
const PHRYGIAN_PARENT: Interval = { steps: -2, semitones: -4 };

const VAMPS: readonly (readonly TemplateChord[])[] = [
	[chord('major', 2, 'I-7', DORIAN_PARENT), chord('major', 5, 'IV7', DORIAN_PARENT)],
	[chord('major', 4, 'IΔ7(♯11)', LYDIAN_PARENT), chord('major', 5, 'II7', LYDIAN_PARENT)],
	[chord('major', 3, 'I-7', PHRYGIAN_PARENT), chord('major', 4, '♭IIΔ7', PHRYGIAN_PARENT)]
];

export interface ProgressionChord extends ChordRef {
	roman: string;
}

export interface Progression {
	kind: ProgressionKind;
	key: PitchClassName;
	chords: ProgressionChord[];
}

function realize(template: readonly TemplateChord[], key: PitchClassName): ProgressionChord[] {
	return template.map((item) => {
		const parentPitch = transpose({ ...key, octave: 4 }, item.parentOffset);
		const parentRoot = { letter: parentPitch.letter, accidental: parentPitch.accidental };
		return {
			root: degreeRoot(item.parent, item.degree, parentRoot),
			mode: modeId(item.parent, item.degree),
			roman: item.roman
		};
	});
}

export function buildProgression(
	kind: ProgressionKind,
	key: PitchClassName,
	rng: Rng
): Progression {
	const template = kind === 'modal-vamp' ? rng.pick(VAMPS) : TEMPLATES[kind];
	return { kind, key, chords: realize(template, key) };
}

export const ALL_ROMAN_NUMERALS: readonly string[] = [
	...new Set([...Object.values(TEMPLATES).flat(), ...VAMPS.flat()].map((item) => item.roman))
];

export const DEGREE_NUMERALS = ROMAN;
