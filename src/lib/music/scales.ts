import { type Pitch, type PitchClassName, transpose } from './pitch';

export const PARENT_SCALES = ['major', 'melodicMinor', 'harmonicMinor'] as const;
export type ParentScale = (typeof PARENT_SCALES)[number];
export type Degree = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type ModeId = `${ParentScale}:${Degree}`;

export const DEGREES: readonly Degree[] = [1, 2, 3, 4, 5, 6, 7];

const PARENT_PATTERNS: Record<ParentScale, readonly number[]> = {
	major: [0, 2, 4, 5, 7, 9, 11],
	melodicMinor: [0, 2, 3, 5, 7, 9, 11],
	harmonicMinor: [0, 2, 3, 5, 7, 8, 11]
};

export const PARENT_NAMES: Record<ParentScale, { en: string; fr: string }> = {
	major: { en: 'major', fr: 'majeur' },
	melodicMinor: { en: 'melodic minor', fr: 'mineur mélodique' },
	harmonicMinor: { en: 'harmonic minor', fr: 'mineur harmonique' }
};

export interface ModeInfo {
	id: ModeId;
	parent: ParentScale;
	degree: Degree;
	name: string;
	frenchName: string;
	chordSuffix: string;
}

const MODE_TABLE: readonly (readonly [ModeId, string, string, string])[] = [
	['major:1', 'Ionian', 'ionien', 'Δ7'],
	['major:2', 'Dorian', 'dorien', '-7'],
	['major:3', 'Phrygian', 'phrygien', '-7'],
	['major:4', 'Lydian', 'lydien', 'Δ7(♯11)'],
	['major:5', 'Mixolydian', 'mixolydien', '7'],
	['major:6', 'Aeolian', 'éolien', '-7'],
	['major:7', 'Locrian', 'locrien', 'ø7'],
	['melodicMinor:1', 'Melodic minor', 'mineur mélodique', '-Δ7'],
	['melodicMinor:2', 'Dorian ♭2', 'dorien ♭2', '7sus4(♭9)'],
	['melodicMinor:3', 'Lydian augmented', 'lydien augmenté', 'Δ7(♯5)'],
	['melodicMinor:4', 'Lydian dominant', 'lydien dominant', '7(♯11)'],
	['melodicMinor:5', 'Mixolydian ♭6', 'mixolydien ♭6', '7(♭13)'],
	['melodicMinor:6', 'Locrian ♮2', 'locrien ♮2', 'ø7'],
	['melodicMinor:7', 'Altered', 'altéré', '7alt'],
	['harmonicMinor:1', 'Harmonic minor', 'mineur harmonique', '-Δ7'],
	['harmonicMinor:2', 'Locrian ♮6', 'locrien ♮6', 'ø7'],
	['harmonicMinor:3', 'Ionian ♯5', 'ionien ♯5', 'Δ7(♯5)'],
	['harmonicMinor:4', 'Dorian ♯4', 'dorien ♯4', '-7(♯11)'],
	['harmonicMinor:5', 'Phrygian dominant', 'phrygien dominant', '7(♭9 ♭13)'],
	['harmonicMinor:6', 'Lydian ♯2', 'lydien ♯2', 'Δ7(♯9)'],
	['harmonicMinor:7', 'Ultralocrian', 'ultralocrien', '°7']
];

export const MODES: readonly ModeInfo[] = MODE_TABLE.map(([id, name, frenchName, chordSuffix]) => {
	const [parent, degreeText] = id.split(':') as [ParentScale, string];
	return { id, parent, degree: Number(degreeText) as Degree, name, frenchName, chordSuffix };
});

const MODE_BY_ID = new Map(MODES.map((mode) => [mode.id, mode]));

export function modeInfo(id: ModeId): ModeInfo {
	const mode = MODE_BY_ID.get(id);
	if (!mode) throw new Error(`Unknown mode ${id}`);
	return mode;
}

export const modeId = (parent: ParentScale, degree: Degree): ModeId => `${parent}:${degree}`;

export const modesOf = (parent: ParentScale): readonly ModeInfo[] =>
	MODES.filter((mode) => mode.parent === parent);

export function modeSemitones(id: ModeId): readonly number[] {
	const { parent, degree } = modeInfo(id);
	const pattern = PARENT_PATTERNS[parent];
	const offset = pattern[degree - 1];
	return pattern.map((_, i) => {
		const value = pattern[(degree - 1 + i) % 7];
		return (value - offset + 12) % 12;
	});
}

export function modeScale(id: ModeId, root: Pitch): Pitch[] {
	return modeSemitones(id).map((semitones, steps) => transpose(root, { steps, semitones }));
}

export function parentRootOf(id: ModeId, modeRoot: PitchClassName): PitchClassName {
	const { parent, degree } = modeInfo(id);
	const offset = PARENT_PATTERNS[parent][degree - 1];
	const shifted = transpose(
		{ ...modeRoot, octave: 4 },
		{ steps: -(degree - 1), semitones: -offset }
	);
	return { letter: shifted.letter, accidental: shifted.accidental };
}

export function degreeRoot(
	parent: ParentScale,
	degree: Degree,
	parentRoot: PitchClassName
): PitchClassName {
	const semitones = PARENT_PATTERNS[parent][degree - 1];
	const shifted = transpose({ ...parentRoot, octave: 4 }, { steps: degree - 1, semitones });
	return { letter: shifted.letter, accidental: shifted.accidental };
}

export type ModeLanguage = 'en' | 'fr';

export function modeLabel(id: ModeId, language: ModeLanguage = 'en'): string {
	const mode = modeInfo(id);
	return language === 'fr' ? mode.frenchName : mode.name;
}

export const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'] as const;

export const isAccidentalHeavy = (name: PitchClassName): boolean => Math.abs(name.accidental) > 1;
