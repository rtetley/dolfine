import { type ChordRef, seventhChordTones } from '#lib/music/chords.ts';
import { type Pitch, placeAbove, placeAtOrAbove, spellMidi, toMidi } from '#lib/music/pitch.ts';
import type { Score, ScoreNote } from '#lib/notation/model.ts';
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
}

export function spellChord(chord: ChordRef, midis: readonly number[]): Pitch[] {
	const names = chordToneNames(chord);
	return [...midis].sort((a, b) => a - b).map((midi) => spellMidi(midi, names));
}

function splitHands(column: SheetColumn): { upper: Pitch[]; lower: Pitch[] } {
	if (column.lhCount !== undefined) {
		return {
			upper: column.pitches.slice(column.lhCount),
			lower: column.pitches.slice(0, column.lhCount)
		};
	}
	return {
		upper: column.pitches.filter((p) => toMidi(p) >= 60),
		lower: column.pitches.filter((p) => toMidi(p) < 60)
	};
}

export function grandStaff(columns: readonly SheetColumn[]): Score {
	const hands = columns.map(splitHands);
	return {
		parts: [
			{
				clef: 'treble',
				measures: columns.map((column, i): ScoreNote[] => {
					const upper = hands[i]?.upper ?? [];
					return [
						{
							id: `${column.id}t`,
							ticks: 48,
							rest: upper.length === 0,
							pitches: upper,
							above: column.label || undefined
						}
					];
				})
			},
			{
				clef: 'bass',
				measures: columns.map((column, i): ScoreNote[] => {
					const lower = hands[i]?.lower ?? [];
					return [{ id: `${column.id}b`, ticks: 48, rest: lower.length === 0, pitches: lower }];
				})
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
