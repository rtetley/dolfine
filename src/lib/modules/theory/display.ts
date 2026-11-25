import { type ChordRef, seventhChordTones } from '#lib/music/chords.ts';
import { type Pitch, placeAbove, placeAtOrAbove, spellMidi, toMidi } from '#lib/music/pitch.ts';
import type { NoteStyle, Score, ScoreNote } from '#lib/notation/model.ts';
import { chordToneNames } from './questions';

export function scaleScore(notes: readonly Pitch[], idPrefix = 's'): Score {
	return {
		parts: [
			{
				clef: 'treble',
				measures: [
					notes.map((pitch, i): ScoreNote => ({
						id: `${idPrefix}${i}`,
						ticks: 12,
						rest: false,
						pitches: [pitch]
					}))
				]
			}
		]
	};
}

export interface SheetColumn {
	id: string;
	pitches: Pitch[];
	label: string;
	lhCount?: number;
	pitchStyles?: readonly (NoteStyle | undefined)[];
}

interface Hand {
	pitches: Pitch[];
	styles: (NoteStyle | undefined)[];
}

export function spellChord(chord: ChordRef, midis: readonly number[]): Pitch[] {
	const names = chordToneNames(chord);
	return [...midis].sort((a, b) => a - b).map((midi) => spellMidi(midi, names));
}

function splitHands(column: SheetColumn): { upper: Hand; lower: Hand } {
	const inLowerHand = (pitch: Pitch, index: number): boolean =>
		column.lhCount !== undefined ? index < column.lhCount : toMidi(pitch) < 60;
	const upper: Hand = { pitches: [], styles: [] };
	const lower: Hand = { pitches: [], styles: [] };
	column.pitches.forEach((pitch, index) => {
		const hand = inLowerHand(pitch, index) ? lower : upper;
		hand.pitches.push(pitch);
		hand.styles.push(column.pitchStyles?.[index]);
	});
	return { upper, lower };
}

const handNote = (id: string, hand: Hand | undefined, above?: string): ScoreNote => {
	const pitches = hand?.pitches ?? [];
	const styles = hand?.styles ?? [];
	return {
		id,
		ticks: 48,
		rest: pitches.length === 0,
		pitches,
		above,
		keyStyles: styles.some(Boolean) ? styles : undefined
	};
};

export function grandStaff(columns: readonly SheetColumn[]): Score {
	const hands = columns.map(splitHands);
	return {
		parts: [
			{
				clef: 'treble',
				measures: columns.map((column, i) => [
					handNote(`${column.id}t`, hands[i]?.upper, column.label || undefined)
				])
			},
			{
				clef: 'bass',
				measures: columns.map((column, i) => [handNote(`${column.id}b`, hands[i]?.lower)])
			}
		]
	};
}

export function closeChord(chord: ChordRef, rootFloor = 55): Pitch[] {
	const [root, ...rest] = seventhChordTones(chord);
	if (!root) return [];
	const pitches: Pitch[] = [placeAtOrAbove(root.name, rootFloor)];
	for (const tone of rest) pitches.push(placeAbove(tone.name, toMidi(pitches.at(-1) as Pitch)));
	return pitches;
}
