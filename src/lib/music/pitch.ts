export const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
export type Letter = (typeof LETTERS)[number];

export type NoteNameSystem = 'letters' | 'solfege';

const LETTER_SEMITONES: Record<Letter, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const SOLFEGE: Record<Letter, string> = {
	C: 'Do',
	D: 'Ré',
	E: 'Mi',
	F: 'Fa',
	G: 'Sol',
	A: 'La',
	B: 'Si'
};
const ACCIDENTAL_SYMBOLS: Record<number, string> = { [-2]: '𝄫', [-1]: '♭', 0: '', 1: '♯', 2: '𝄪' };
const VEX_ACCIDENTALS: Record<number, string> = { [-2]: 'bb', [-1]: 'b', 0: 'n', 1: '#', 2: '##' };

export interface PitchClassName {
	letter: Letter;
	accidental: number;
}

export interface Pitch extends PitchClassName {
	octave: number;
}

export interface Interval {
	steps: number;
	semitones: number;
}

export const mod = (value: number, modulus: number): number =>
	((value % modulus) + modulus) % modulus;

export const letterAt = (index: number): Letter => LETTERS[mod(index, 7)];

export const letterIndex = (letter: Letter): number => LETTERS.indexOf(letter);

export const toMidi = (pitch: Pitch): number =>
	12 * (pitch.octave + 1) + LETTER_SEMITONES[pitch.letter] + pitch.accidental;

export const pitchClassOf = (name: PitchClassName): number =>
	mod(LETTER_SEMITONES[name.letter] + name.accidental, 12);

export function transpose(pitch: Pitch, interval: Interval): Pitch {
	const rawIndex = letterIndex(pitch.letter) + interval.steps;
	const letter = letterAt(rawIndex);
	const octave = pitch.octave + Math.floor(rawIndex / 7);
	const natural = toMidi({ letter, accidental: 0, octave });
	return { letter, octave, accidental: toMidi(pitch) + interval.semitones - natural };
}

export function placeAbove(name: PitchClassName, floorMidi: number): Pitch {
	const base: Pitch = { ...name, octave: -1 };
	const lift = Math.floor((floorMidi - toMidi(base)) / 12) + 1;
	return { ...name, octave: base.octave + Math.max(0, lift) };
}

export function placeAtOrAbove(name: PitchClassName, floorMidi: number): Pitch {
	return placeAbove(name, floorMidi - 1);
}

const SHARP_SPELLINGS: readonly PitchClassName[] = [
	{ letter: 'C', accidental: 0 },
	{ letter: 'C', accidental: 1 },
	{ letter: 'D', accidental: 0 },
	{ letter: 'D', accidental: 1 },
	{ letter: 'E', accidental: 0 },
	{ letter: 'F', accidental: 0 },
	{ letter: 'F', accidental: 1 },
	{ letter: 'G', accidental: 0 },
	{ letter: 'G', accidental: 1 },
	{ letter: 'A', accidental: 0 },
	{ letter: 'A', accidental: 1 },
	{ letter: 'B', accidental: 0 }
];

const FLAT_SPELLINGS: readonly PitchClassName[] = SHARP_SPELLINGS.map((name) =>
	name.accidental === 1 ? { letter: letterAt(letterIndex(name.letter) + 1), accidental: -1 } : name
);

export function fromMidi(midi: number, preferFlats = false): Pitch {
	const spellings = preferFlats ? FLAT_SPELLINGS : SHARP_SPELLINGS;
	const name = spellings[mod(midi, 12)];
	const octave = Math.floor((midi - LETTER_SEMITONES[name.letter] - name.accidental) / 12) - 1;
	return { ...name, octave };
}

export function spellMidi(midi: number, candidates: readonly PitchClassName[]): Pitch {
	const match = candidates.find((name) => pitchClassOf(name) === mod(midi, 12));
	if (!match) return fromMidi(midi);
	const octave = Math.floor((midi - LETTER_SEMITONES[match.letter] - match.accidental) / 12) - 1;
	return { ...match, octave };
}

export const accidentalSymbol = (accidental: number): string =>
	ACCIDENTAL_SYMBOLS[accidental] ?? '';

export function noteName(name: PitchClassName, system: NoteNameSystem = 'letters'): string {
	const base = system === 'solfege' ? SOLFEGE[name.letter] : name.letter;
	return `${base}${accidentalSymbol(name.accidental)}`;
}

export const pitchLabel = (pitch: Pitch, system: NoteNameSystem = 'letters'): string =>
	`${noteName(pitch, system)}${pitch.octave}`;

export const vexKey = (pitch: Pitch): string =>
	`${pitch.letter.toLowerCase()}${pitch.accidental === 0 ? '' : VEX_ACCIDENTALS[pitch.accidental]}/${pitch.octave}`;

export const vexAccidental = (accidental: number): string => VEX_ACCIDENTALS[accidental] ?? 'n';

export function parsePitch(text: string): Pitch {
	const match = /^([A-G])(bb|b|##|#|)(-?\d+)$/.exec(text.trim());
	if (!match) throw new Error(`Cannot parse pitch "${text}"`);
	const [, letter, accidentalText, octaveText] = match;
	const accidentals: Record<string, number> = { bb: -2, b: -1, '': 0, '#': 1, '##': 2 };
	return {
		letter: letter as Letter,
		accidental: accidentals[accidentalText ?? ''] ?? 0,
		octave: Number(octaveText)
	};
}

export const samePitchClass = (a: PitchClassName, b: PitchClassName): boolean =>
	pitchClassOf(a) === pitchClassOf(b);

export const sameSpelling = (a: PitchClassName, b: PitchClassName): boolean =>
	a.letter === b.letter && a.accidental === b.accidental;

export const ALL_ROOTS: readonly PitchClassName[] = [
	{ letter: 'C', accidental: 0 },
	{ letter: 'D', accidental: -1 },
	{ letter: 'D', accidental: 0 },
	{ letter: 'E', accidental: -1 },
	{ letter: 'E', accidental: 0 },
	{ letter: 'F', accidental: 0 },
	{ letter: 'F', accidental: 1 },
	{ letter: 'G', accidental: 0 },
	{ letter: 'A', accidental: -1 },
	{ letter: 'A', accidental: 0 },
	{ letter: 'B', accidental: -1 },
	{ letter: 'B', accidental: 0 }
];
