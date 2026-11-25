import {
	type PitchClassName,
	noteName,
	type NoteNameSystem,
	pitchClassOf,
	transpose
} from './pitch';
import { type ModeId, modeInfo, modeSemitones } from './scales';

export type ChordSymbolStyle = 'jazz' | 'classic';

export type ToneToken = 1 | 3 | 4 | 5 | 7 | 9 | 11 | 13 | 'sharp9';

export interface ChordRef {
	root: PitchClassName;
	mode: ModeId;
}

export interface ChordTone {
	token: ToneToken;
	label: string;
	name: PitchClassName;
	semitones: number;
}

const NATURAL_SEMITONES: Record<number, number> = {
	1: 0,
	3: 4,
	4: 5,
	5: 7,
	7: 11,
	9: 14,
	11: 17,
	13: 21
};
const ALTERATION_PREFIX: Record<number, string> = { [-2]: '𝄫', [-1]: '♭', 0: '', 1: '♯', 2: '𝄪' };

export function toneInterval(mode: ModeId, token: ToneToken): { steps: number; semitones: number } {
	const scale = modeSemitones(mode);
	if (token === 'sharp9') return { steps: 2, semitones: scale[2] };
	if (token === 3 && mode === 'melodicMinor:7') return { steps: 2, semitones: scale[3] };
	const stepIndex = (token - 1) % 7;
	const octave = token > 7 ? 12 : 0;
	return { steps: token - 1, semitones: scale[stepIndex] + octave };
}

export function toneLabel(mode: ModeId, token: ToneToken): string {
	if (token === 'sharp9') return '♯9';
	const { semitones } = toneInterval(mode, token);
	const natural = NATURAL_SEMITONES[token];
	return `${ALTERATION_PREFIX[semitones - natural] ?? '?'}${token}`;
}

export function chordTone(chord: ChordRef, token: ToneToken): ChordTone {
	const interval = toneInterval(chord.mode, token);
	const pitch = transpose({ ...chord.root, octave: 4 }, interval);
	return {
		token,
		label: toneLabel(chord.mode, token),
		name: { letter: pitch.letter, accidental: pitch.accidental },
		semitones: interval.semitones
	};
}

export const SEVENTH_CHORD_TOKENS: readonly ToneToken[] = [1, 3, 5, 7];

export function seventhChordTones(chord: ChordRef): ChordTone[] {
	const tokens: readonly ToneToken[] =
		chord.mode === 'melodicMinor:2' ? [1, 4, 5, 7] : SEVENTH_CHORD_TOKENS;
	return tokens.map((token) => chordTone(chord, token));
}

export function formatSuffix(suffix: string, style: ChordSymbolStyle): string {
	if (style === 'jazz') return suffix;
	return suffix
		.replace(/^-Δ(\d+)/, 'm(maj$1)')
		.replace(/Δ/g, 'maj')
		.replace(/ø(\d+)/, 'm$1♭5')
		.replace(/°(\d+)/, 'dim$1')
		.replace(/^-/, 'm');
}

export function chordSymbol(
	chord: ChordRef,
	style: ChordSymbolStyle = 'jazz',
	system: NoteNameSystem = 'letters'
): string {
	return `${noteName(chord.root, system)}${formatSuffix(modeInfo(chord.mode).chordSuffix, style)}`;
}

export function chordPitchClasses(chord: ChordRef, tokens: readonly ToneToken[]): Set<number> {
	return new Set(tokens.map((token) => pitchClassOf(chordTone(chord, token).name)));
}
