import {
	type ChordRef,
	chordTone,
	seventhChordTones,
	type ToneToken,
	toneLabel
} from '#lib/music/chords.ts';
import {
	ALL_ROOTS,
	type Pitch,
	type PitchClassName,
	placeAbove,
	placeAtOrAbove,
	toMidi
} from '#lib/music/pitch.ts';
import {
	DEGREES,
	type Degree,
	degreeRoot,
	type ModeId,
	modeId,
	modeScale,
	type ParentScale
} from '#lib/music/scales.ts';
import { defaultVoicing, voicingSpec } from '#lib/music/voicings.ts';

export const LESSONS = [
	'major',
	'chord-colours',
	'four-colours',
	'melodic-minor',
	'harmonic-minor',
	'voicings'
] as const;
export type LessonId = (typeof LESSONS)[number];
export type ScaleLessonId = 'major' | 'melodic-minor' | 'harmonic-minor';
export type ColourLessonId = 'chord-colours' | 'four-colours';

export const LESSON_PARENTS: Record<ScaleLessonId, ParentScale> = {
	major: 'major',
	'melodic-minor': 'melodicMinor',
	'harmonic-minor': 'harmonicMinor'
};

export const isScaleLesson = (lesson: LessonId): lesson is ScaleLessonId =>
	lesson in LESSON_PARENTS;

export const isLessonId = (value: string): value is LessonId =>
	(LESSONS as readonly string[]).includes(value);

/** Chord symbol suffixes a mode is usually written as; the first is its seventh chord. */
export const TYPICAL_CHORDS: Record<ModeId, readonly string[]> = {
	'major:1': ['Δ7', 'Δ9', '6', '6/9'],
	'major:2': ['-7', '-9', '-11', '-13'],
	'major:3': ['-7', '7sus4(♭9)'],
	'major:4': ['Δ7(♯11)', 'Δ9(♯11)'],
	'major:5': ['7', '9', '13', '7sus4'],
	'major:6': ['-7', '-9', '-11', '-7(♭13)'],
	'major:7': ['ø7', 'ø7(11)'],
	'melodicMinor:1': ['-Δ7', '-Δ9', '-6', '-6/9'],
	'melodicMinor:2': ['7sus4(♭9)', '13sus4(♭9)'],
	'melodicMinor:3': ['Δ7(♯5)', 'Δ7(♯5 ♯11)'],
	'melodicMinor:4': ['7(♯11)', '9(♯11)', '13(♯11)'],
	'melodicMinor:5': ['7(♭13)', '9(♭13)'],
	'melodicMinor:6': ['ø7', 'ø9'],
	'melodicMinor:7': ['7alt', '7(♯9 ♭13)', '7(♭9 ♯9)'],
	'harmonicMinor:1': ['-Δ7', '-Δ9'],
	'harmonicMinor:2': ['ø7', 'ø7(13)'],
	'harmonicMinor:3': ['Δ7(♯5)', 'Δ9(♯5)'],
	'harmonicMinor:4': ['-7(♯11)', '-9(♯11)'],
	'harmonicMinor:5': ['7(♭9 ♭13)', '7(♭9)', '7sus4(♭9)'],
	'harmonicMinor:6': ['Δ7(♯9)', 'Δ7(♯9 ♯11)'],
	'harmonicMinor:7': ['°7', '°7(♭13)']
};

/** The degrees that set a mode apart from its neighbours, relative to the mode's root. */
export const CHARACTERISTIC_NOTES: Record<ModeId, readonly string[]> = {
	'major:1': ['7'],
	'major:2': ['6'],
	'major:3': ['♭2'],
	'major:4': ['♯4'],
	'major:5': ['3', '♭7'],
	'major:6': ['♭6'],
	'major:7': ['♭2', '♭5'],
	'melodicMinor:1': ['♭3', '7'],
	'melodicMinor:2': ['♭2', '6'],
	'melodicMinor:3': ['♯4', '♯5'],
	'melodicMinor:4': ['♯4', '♭7'],
	'melodicMinor:5': ['3', '♭6'],
	'melodicMinor:6': ['2', '♭5'],
	'melodicMinor:7': ['♭9', '♯9', '♯11', '♭13'],
	'harmonicMinor:1': ['♭6', '7'],
	'harmonicMinor:2': ['♭5', '6'],
	'harmonicMinor:3': ['♯5'],
	'harmonicMinor:4': ['♯4', '6'],
	'harmonicMinor:5': ['♭2', '3', '♭6'],
	'harmonicMinor:6': ['♯2', '♯4'],
	'harmonicMinor:7': ['♭4', '𝄫7']
};

export interface DegreeStudy {
	degree: Degree;
	mode: ModeId;
	chord: ChordRef;
	scale: Pitch[];
	seventh: Pitch[];
}

const LOW_LETTERS = new Set(['C', 'D', 'E', 'F']);

function stack(names: readonly PitchClassName[], floor: number): Pitch[] {
	const [first, ...rest] = names;
	if (!first) return [];
	const pitches = [placeAtOrAbove(first, floor)];
	for (const name of rest) pitches.push(placeAbove(name, toMidi(pitches.at(-1) as Pitch)));
	return pitches;
}

const tokenNames = (chord: ChordRef, tokens: readonly ToneToken[]): PitchClassName[] =>
	tokens.map((token) => chordTone(chord, token).name);

export function harmonise(parent: ParentScale, parentRoot: PitchClassName): DegreeStudy[] {
	return DEGREES.map((degree) => {
		const mode = modeId(parent, degree);
		const root = degreeRoot(parent, degree, parentRoot);
		const chord = { root, mode };
		const octave = LOW_LETTERS.has(root.letter) ? 4 : 3;
		return {
			degree,
			mode,
			chord,
			scale: modeScale(mode, { ...root, octave }),
			seventh: stack(
				seventhChordTones(chord).map((tone) => tone.name),
				octave === 4 ? 60 : 55
			)
		};
	});
}

export const VOICING_KINDS = [
	'close',
	'drop2',
	'shell-37',
	'shell-73',
	'rootless-a',
	'rootless-b',
	'type-a',
	'type-b'
] as const;
export type VoicingKind = (typeof VOICING_KINDS)[number];

export interface LessonVoicing {
	kind: VoicingKind;
	pitches: Pitch[];
	tokens: ToneToken[];
	lhCount?: number;
	alternative: boolean;
}

export function rootlessTokens(mode: ModeId, start: 'a' | 'b'): ToneToken[] {
	const [third, middle, tension] = voicingSpec(mode, 'A').rh;
	return start === 'a' ? [third, middle, 7, tension] : [7, tension, third, middle];
}

const lower = (pitch: Pitch): Pitch => ({ ...pitch, octave: pitch.octave - 1 });

export function lessonVoicings(chord: ChordRef): LessonVoicing[] {
	const seventh = seventhChordTones(chord).map((tone) => tone.token);
	const [root, third, , sev] = seventh as [ToneToken, ToneToken, ToneToken, ToneToken];
	const alternative = voicingSpec(chord.mode, 'A').alternative;
	const close = stack(tokenNames(chord, seventh), 60);
	const [c1, c2, c3, c4] = close as [Pitch, Pitch, Pitch, Pitch];
	const [, t2, t3, t4] = seventh;
	const shell = (kind: VoicingKind, tokens: ToneToken[]): LessonVoicing => ({
		kind,
		pitches: stack(tokenNames(chord, tokens), 43),
		tokens,
		lhCount: tokens.length,
		alternative: false
	});
	const rootless = (start: 'a' | 'b'): LessonVoicing => {
		const tokens = rootlessTokens(chord.mode, start);
		return {
			kind: start === 'a' ? 'rootless-a' : 'rootless-b',
			pitches: stack(tokenNames(chord, tokens), 52),
			tokens,
			alternative
		};
	};
	const twoHand = (type: 'A' | 'B'): LessonVoicing => {
		const voicing = defaultVoicing(chord, type);
		return {
			kind: type === 'A' ? 'type-a' : 'type-b',
			pitches: voicing.notes,
			tokens: voicing.tokens,
			lhCount: voicing.lh.length,
			alternative
		};
	};
	return [
		{ kind: 'close', pitches: close, tokens: seventh, lhCount: 0, alternative: false },
		{
			kind: 'drop2',
			pitches: [lower(c3), c1, c2, c4],
			tokens: [t3, root, t2, t4] as ToneToken[],
			alternative: false
		},
		shell('shell-37', [root, third, sev]),
		shell('shell-73', [root, sev, third]),
		rootless('a'),
		rootless('b'),
		twoHand('A'),
		twoHand('B')
	];
}

export const voicingFormula = (mode: ModeId, voicing: LessonVoicing): string => {
	const labels = voicing.tokens.map((token) => toneLabel(mode, token));
	if (voicing.lhCount === undefined || voicing.lhCount === 0) return labels.join(' ');
	if (voicing.lhCount >= labels.length) return labels.join(' ');
	return `${labels.slice(0, voicing.lhCount).join(' ')} / ${labels.slice(voicing.lhCount).join(' ')}`;
};

export const rootCode = (name: PitchClassName): string =>
	`${name.letter}${name.accidental === -1 ? 'b' : name.accidental === 1 ? '#' : ''}`;

export function parseRootCode(code: string | null): PitchClassName | null {
	const match = /^([A-G])(b|#)?$/.exec(code ?? '');
	if (!match) return null;
	const name = {
		letter: match[1] as PitchClassName['letter'],
		accidental: match[2] === 'b' ? -1 : match[2] === '#' ? 1 : 0
	};
	return ALL_ROOTS.some(
		(root) => root.letter === name.letter && root.accidental === name.accidental
	)
		? name
		: null;
}
