import { m } from '#lib/i18n.ts';
import {
	type Letter,
	letterAt,
	letterIndex,
	type NoteNameSystem,
	noteName,
	type Pitch,
	type PitchClassName,
	toMidi
} from './pitch';
import type { Rng } from './random';
import { generateRhythm, type Meter, type RhythmEvent, type RhythmFeature } from './rhythm';

export type Clef = 'treble' | 'bass';
export type StaffSetup = Clef | 'grand';
export type KeyMode = 'major' | 'minor';
export type RangeKind = 'staff' | 'ledger' | 'full';

export interface KeySignature {
	fifths: number;
	mode: KeyMode;
}

export interface MelodyNote extends RhythmEvent {
	pitch?: Pitch;
}

export interface MelodySettings {
	key: KeySignature;
	meter: Meter;
	bars: number;
	clef: Clef;
	range: RangeKind;
	features: ReadonlySet<RhythmFeature>;
	maxLeap: number;
	accidentalRate: number;
}

const SHARP_ORDER: readonly Letter[] = ['F', 'C', 'G', 'D', 'A', 'E', 'B'];
const FLAT_ORDER: readonly Letter[] = ['B', 'E', 'A', 'D', 'G', 'C', 'F'];
const MAJOR_TONICS = [
	'Cb',
	'Gb',
	'Db',
	'Ab',
	'Eb',
	'Bb',
	'F',
	'C',
	'G',
	'D',
	'A',
	'E',
	'B',
	'F#',
	'C#'
] as const;
const MINOR_TONICS = [
	'Ab',
	'Eb',
	'Bb',
	'F',
	'C',
	'G',
	'D',
	'A',
	'E',
	'B',
	'F#',
	'C#',
	'G#',
	'D#',
	'A#'
] as const;

const RANGES: Record<Clef, Record<RangeKind, readonly [number, number]>> = {
	treble: { staff: [64, 77], ledger: [57, 84], full: [55, 88] },
	bass: { staff: [43, 57], ledger: [36, 64], full: [33, 67] }
};

export function keyAccidentals(fifths: number): Map<Letter, number> {
	const map = new Map<Letter, number>();
	const order = fifths >= 0 ? SHARP_ORDER : FLAT_ORDER;
	order.slice(0, Math.abs(fifths)).forEach((letter) => map.set(letter, fifths >= 0 ? 1 : -1));
	return map;
}

export function tonicName(key: KeySignature): PitchClassName {
	const text = (key.mode === 'major' ? MAJOR_TONICS : MINOR_TONICS)[key.fifths + 7] as string;
	const accidental = text.endsWith('#') ? 1 : text.endsWith('b') && text.length > 1 ? -1 : 0;
	return { letter: text[0] as Letter, accidental };
}

export const vexKeySignature = (key: KeySignature): string =>
	`${(key.mode === 'major' ? MAJOR_TONICS : MINOR_TONICS)[key.fifths + 7] as string}${key.mode === 'minor' ? 'm' : ''}`;

export function keyLabel(key: KeySignature, names: NoteNameSystem = 'letters'): string {
	const tonic = noteName(tonicName(key), names);
	return key.mode === 'major' ? m.key_name_major({ tonic }) : m.key_name_minor({ tonic });
}

export function diatonicPitches(key: KeySignature, low: number, high: number): Pitch[] {
	const accidentals = keyAccidentals(key.fifths);
	const pitches: Pitch[] = [];
	for (let octave = 0; octave <= 8; octave++) {
		for (let i = 0; i < 7; i++) {
			const letter = letterAt(i);
			const pitch = { letter, accidental: accidentals.get(letter) ?? 0, octave };
			const midi = toMidi(pitch);
			if (midi >= low && midi <= high) pitches.push(pitch);
		}
	}
	return pitches.sort((a, b) => toMidi(a) - toMidi(b));
}

export const staffRange = (clef: Clef, range: RangeKind): readonly [number, number] =>
	RANGES[clef][range];

function isTonicTriad(pitch: Pitch, tonic: PitchClassName): boolean {
	const distance = (letterIndex(pitch.letter) - letterIndex(tonic.letter) + 7) % 7;
	return distance === 0 || distance === 2 || distance === 4;
}

const isTonic = (pitch: Pitch, tonic: PitchClassName): boolean => pitch.letter === tonic.letter;

export function generateMelody(settings: MelodySettings, rng: Rng): MelodyNote[][] {
	const [low, high] = staffRange(settings.clef, settings.range);
	const scale = diatonicPitches(settings.key, low, high);
	const tonic = tonicName(settings.key);
	const rhythm = generateRhythm(settings.meter, settings.bars, settings.features, rng);
	const starts = scale
		.map((pitch, index) => ({ pitch, index }))
		.filter(({ pitch }) => isTonicTriad(pitch, tonic));
	const middle = Math.floor(scale.length / 2);
	const start = starts.reduce((best, item) =>
		Math.abs(item.index - middle) < Math.abs(best.index - middle) ? item : best
	);
	let current = start.index;
	const raisedLeadingTone = settings.key.mode === 'minor';

	const notesTotal = rhythm.flat().filter((event) => !event.rest).length;
	let placed = 0;

	return rhythm.map((measure) =>
		measure.map((event): MelodyNote => {
			if (event.rest) return { ...event };
			placed++;
			if (placed > 1) current = nextIndex(current, scale.length, settings.maxLeap, rng);
			if (placed === notesTotal) current = closestTonic(scale, current, tonic);
			const base = scale[current];
			const pitch = decorate(
				base,
				tonic,
				raisedLeadingTone,
				settings.accidentalRate,
				placed === notesTotal,
				rng
			);
			return { ...event, pitch };
		})
	);
}

function nextIndex(current: number, size: number, maxLeap: number, rng: Rng): number {
	const step = rng.weighted<number>([
		[1, 6],
		[-1, 6],
		[2, maxLeap >= 2 ? 2 : 0],
		[-2, maxLeap >= 2 ? 2 : 0],
		[3, maxLeap >= 3 ? 1 : 0],
		[-3, maxLeap >= 3 ? 1 : 0],
		[4, maxLeap >= 4 ? 1 : 0],
		[-4, maxLeap >= 4 ? 1 : 0],
		[0, 1]
	]);
	const target = current + step;
	if (target < 0 || target >= size)
		return current - step >= 0 && current - step < size ? current - step : current;
	return target;
}

function closestTonic(scale: readonly Pitch[], current: number, tonic: PitchClassName): number {
	let best = current;
	let distance = Infinity;
	scale.forEach((pitch, index) => {
		if (isTonic(pitch, tonic) && Math.abs(index - current) < distance) {
			best = index;
			distance = Math.abs(index - current);
		}
	});
	return best;
}

function decorate(
	pitch: Pitch,
	tonic: PitchClassName,
	raisedLeadingTone: boolean,
	accidentalRate: number,
	isLast: boolean,
	rng: Rng
): Pitch {
	if (isLast) return pitch;
	const leadingLetter = letterAt(letterIndex(tonic.letter) + 6);
	if (raisedLeadingTone && pitch.letter === leadingLetter && rng.chance(0.6)) {
		return { ...pitch, accidental: pitch.accidental + 1 };
	}
	if (accidentalRate > 0 && rng.chance(accidentalRate)) {
		const shift = rng.chance(0.5) ? 1 : -1;
		const accidental = pitch.accidental + shift;
		if (Math.abs(accidental) <= 1) return { ...pitch, accidental };
	}
	return pitch;
}

export function bassLine(settings: MelodySettings, rng: Rng): MelodyNote[][] {
	const tonic = tonicName(settings.key);
	const [low, high] = staffRange('bass', 'staff');
	const scale = diatonicPitches(settings.key, low, high);
	const tonicIndex = scale.findIndex((pitch) => isTonic(pitch, tonic));
	const degrees = [0, 3, 4, 0, 5, 3, 4, 0];
	const measureLength = (settings.meter.beats * 48) / settings.meter.unit;
	return Array.from({ length: settings.bars }, (_, bar) => {
		const degree =
			bar === settings.bars - 1
				? 0
				: rng.chance(0.3)
					? rng.pick(degrees)
					: degrees[bar % degrees.length];
		const index = Math.min(
			scale.length - 1,
			Math.max(0, tonicIndex + degree - (degree > 4 ? 7 : 0))
		);
		return [{ ticks: measureLength, rest: false, pitch: scale[index] }];
	});
}
