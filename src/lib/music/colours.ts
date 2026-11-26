import type { Level } from './levels';
import {
	type Interval,
	type Pitch,
	type PitchClassName,
	placeAbove,
	placeAtOrAbove,
	toMidi,
	transpose
} from './pitch';

/**
 * Chord colours: the sixteen chords a jazz pianist learns as sounds, each with the scale it comes
 * from and two voicings, type A (1 7 / 3 5 9) and type B (1 3 7 / 9 5). The twelve first colours
 * come with the major scale's harmonization; the last four complete the modes of the major scale.
 *
 * Tones are written as scale degrees from the root ("♭3", "♯11"), so every colour is spelled
 * correctly in all twelve keys.
 */

export const COLOUR_TOKENS = [
	'1',
	'♭2',
	'2',
	'♭3',
	'3',
	'4',
	'♯4',
	'♭5',
	'5',
	'♯5',
	'♭6',
	'6',
	'𝄫7',
	'♭7',
	'7',
	'♭9',
	'9',
	'♯9',
	'11',
	'♯11',
	'♭13',
	'13'
] as const;
export type ColourToken = (typeof COLOUR_TOKENS)[number];

const MAJOR_SEMITONES = [0, 2, 4, 5, 7, 9, 11];

/** The interval a degree token stands for: "♭3" is a third (2 steps) of 3 semitones. */
export function tokenInterval(token: ColourToken): Interval {
	const alteration = token.startsWith('𝄫')
		? -2
		: token.startsWith('♭')
			? -1
			: token.startsWith('♯')
				? 1
				: 0;
	const degree = Number(token.replace(/^[♭♯𝄫]/u, ''));
	const steps = degree - 1;
	const semitones = MAJOR_SEMITONES[steps % 7] + 12 * Math.floor(steps / 7) + alteration;
	return { steps, semitones };
}

export const COLOUR_SCALES = {
	ionian: ['1', '2', '3', '4', '5', '6', '7'],
	ionianFlat3: ['1', '2', '♭3', '4', '5', '6', '7'],
	dorian: ['1', '2', '♭3', '4', '5', '6', '♭7'],
	phrygian: ['1', '♭2', '♭3', '4', '5', '♭6', '♭7'],
	lydian: ['1', '2', '3', '♯4', '5', '6', '7'],
	mixolydian: ['1', '2', '3', '4', '5', '6', '♭7'],
	aeolian: ['1', '2', '♭3', '4', '5', '♭6', '♭7'],
	locrian: ['1', '♭2', '♭3', '4', '♭5', '♭6', '♭7'],
	wholeHalf: ['1', '2', '♭3', '4', '♭5', '♭6', '6', '7'],
	wholeTone: ['1', '2', '3', '♯4', '♯5', '♭7'],
	phrygianDominant: ['1', '♭2', '3', '4', '5', '♭6', '♭7'],
	blues: ['1', '♭3', '4', '♭5', '5', '♭7']
} as const satisfies Record<string, readonly ColourToken[]>;
export type ColourScale = keyof typeof COLOUR_SCALES;

export const COLOURS = [
	'maj9',
	'69',
	'mMaj9',
	'm69',
	'm9',
	'm7b5',
	'dim',
	'9',
	'9sus4',
	'9#5',
	'7b9',
	'7#9',
	'm11',
	'7b9sus4',
	'maj9#11',
	'm7b6'
] as const;
export type ColourId = (typeof COLOURS)[number];

export type ColourVoicingType = 'A' | 'B';

interface Hands {
	lh: readonly ColourToken[];
	rh: readonly ColourToken[];
}

export interface ChordColour {
	id: ColourId;
	/** The chord symbol after the root, in jazz notation (formatted for the chosen style). */
	suffix: string;
	scale: ColourScale;
	voicings: Record<ColourVoicingType, Hands>;
	/** The colour it is easiest to mistake it for: the one it is first heard against. */
	similar: ColourId;
	/** The twelve colours of the chord–mode lesson, or the four that complete the modes. */
	group: 'twelve' | 'four';
}

const hands = (lh: ColourToken[], rh: ColourToken[]): Hands => ({ lh, rh });

/** Type A and B with one tone swapped in for another (a sixth for the seventh, a fourth for the third…). */
function colour(
	id: ColourId,
	suffix: string,
	scale: ColourScale,
	[third, seventh, fifth, ninth]: [ColourToken, ColourToken, ColourToken, ColourToken],
	similar: ColourId,
	group: ChordColour['group'] = 'twelve'
): ChordColour {
	return {
		id,
		suffix,
		scale,
		voicings: {
			A: hands(['1', seventh], [third, fifth, ninth]),
			B: hands(['1', third, seventh], [ninth, fifth])
		},
		similar,
		group
	};
}

/**
 * Half-diminished and diminished chords have no ninth in their scale's first colours: their
 * voicings double the seventh (type A) or the third (type B) in its place.
 */
function doubled(
	id: ColourId,
	suffix: string,
	scale: ColourScale,
	third: ColourToken,
	fifth: ColourToken,
	seventh: ColourToken,
	similar: ColourId
): ChordColour {
	return {
		id,
		suffix,
		scale,
		voicings: {
			A: hands(['1', seventh], [third, fifth, seventh]),
			B: hands(['1', third, seventh], [third, fifth])
		},
		similar,
		group: 'twelve'
	};
}

export const CHORD_COLOURS: Record<ColourId, ChordColour> = {
	maj9: colour('maj9', 'Δ9', 'ionian', ['3', '7', '5', '9'], '69'),
	'69': colour('69', '6/9', 'ionian', ['3', '6', '5', '9'], 'maj9'),
	mMaj9: colour('mMaj9', '-Δ9', 'ionianFlat3', ['♭3', '7', '5', '9'], 'm69'),
	m69: colour('m69', '-6/9', 'ionianFlat3', ['♭3', '6', '5', '9'], 'mMaj9'),
	m9: colour('m9', '-9', 'dorian', ['♭3', '♭7', '5', '9'], 'm7b5'),
	m7b5: doubled('m7b5', 'ø7', 'locrian', '♭3', '♭5', '♭7', 'm9'),
	dim: doubled('dim', '°7', 'wholeHalf', '♭3', '♭5', '𝄫7', 'm7b5'),
	'9': colour('9', '9', 'mixolydian', ['3', '♭7', '5', '9'], '9sus4'),
	'9sus4': colour('9sus4', '9sus4', 'mixolydian', ['4', '♭7', '5', '9'], '9'),
	'9#5': colour('9#5', '9(♯5)', 'wholeTone', ['3', '♭7', '♯5', '9'], '9'),
	'7b9': colour('7b9', '7(♭9)', 'phrygianDominant', ['3', '♭7', '5', '♭9'], '7#9'),
	'7#9': colour('7#9', '7(♯9)', 'blues', ['3', '♭7', '5', '♯9'], '7b9'),
	m11: colour('m11', '-11', 'dorian', ['♭3', '♭7', '5', '11'], 'm9', 'four'),
	'7b9sus4': colour('7b9sus4', '7sus4(♭9)', 'phrygian', ['4', '♭7', '5', '♭9'], '9sus4', 'four'),
	'maj9#11': colour('maj9#11', 'Δ9(♯11)', 'lydian', ['3', '7', '♯11', '9'], 'maj9', 'four'),
	m7b6: colour('m7b6', '-7(♭13)', 'aeolian', ['♭3', '♭7', '♭13', '9'], 'm9', 'four')
};

export const coloursIn = (group: ChordColour['group']): ColourId[] =>
	COLOURS.filter((id) => CHORD_COLOURS[id].group === group);

const LOW_LETTERS = new Set(['C', 'D', 'E', 'F']);

const pitchClass = (root: PitchClassName, token: ColourToken): PitchClassName => {
	const pitch = transpose({ ...root, octave: 4 }, tokenInterval(token));
	return { letter: pitch.letter, accidental: pitch.accidental };
};

/** Stacks names upwards from a floor, each above the last. */
function stack(names: readonly PitchClassName[], floor: number): Pitch[] {
	const pitches: Pitch[] = [];
	names.forEach((name, i) => {
		const below = i === 0 ? floor - 1 : toMidi(pitches[i - 1]);
		pitches.push(i === 0 ? placeAtOrAbove(name, floor) : placeAbove(name, below));
	});
	return pitches;
}

/**
 * A colour voiced over two hands: the left hand from the root around the bottom of the bass
 * staff, the right hand stacked above it from about middle C.
 */
export function colourVoicing(
	id: ColourId,
	root: PitchClassName,
	type: ColourVoicingType
): { lh: Pitch[]; rh: Pitch[] } {
	const { lh, rh } = CHORD_COLOURS[id].voicings[type];
	const left = stack(
		lh.map((token) => pitchClass(root, token)),
		LOW_LETTERS.has(root.letter) ? 48 : 43
	);
	const right = stack(
		rh.map((token) => pitchClass(root, token)),
		Math.max(toMidi(left.at(-1) as Pitch) + 1, 57)
	);
	return { lh: left, rh: right };
}

export const colourMidis = (
	id: ColourId,
	root: PitchClassName,
	type: ColourVoicingType
): number[] => {
	const { lh, rh } = colourVoicing(id, root, type);
	return [...lh, ...rh].map(toMidi);
};

/** The colour's scale from its root, an octave from around middle C. */
export function colourScale(id: ColourId, root: PitchClassName): Pitch[] {
	const tonic: Pitch = { ...root, octave: LOW_LETTERS.has(root.letter) ? 4 : 3 };
	return COLOUR_SCALES[CHORD_COLOURS[id].scale].map((token) =>
		transpose(tonic, tokenInterval(token))
	);
}

/**
 * The colours heard together at each step of ear training, adding one or two at a time and
 * pairing a newcomer with the colour it is easiest to mistake it for: first Δ9 against 6/9, then
 * their minor counterparts, then all four… then all twelve, the four new colours against their
 * neighbours, and finally all sixteen.
 */
export const COLOUR_SETS: Record<Level, readonly ColourId[]> = {
	1: ['maj9', '69'],
	2: ['mMaj9', 'm69'],
	3: ['maj9', '69', 'mMaj9', 'm69'],
	4: ['m9', 'm7b5'],
	5: ['m7b5', 'dim', 'm9'],
	6: ['9', '9sus4', '9#5'],
	7: ['7b9', '7#9', '9'],
	8: coloursIn('twelve'),
	9: ['m11', 'm9', '7b9sus4', '9sus4', 'maj9#11', 'maj9', 'm7b6'],
	10: [...COLOURS]
};
