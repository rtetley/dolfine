import type { Letter, Pitch } from '#lib/music/pitch.ts';
import type { Meter } from '#lib/music/rhythm.ts';

export type StaffClef = 'treble' | 'bass' | 'percussion';

export type NoteStyle = 'correct' | 'wrong' | 'missed' | 'early' | 'late' | 'reference' | 'current';

export interface ScoreNote {
	id: string;
	ticks: number;
	rest: boolean;
	pitches: Pitch[];
	tie?: boolean;
	triplet?: boolean;
	below?: string;
	above?: string;
	style?: NoteStyle;
	keyStyles?: readonly (NoteStyle | undefined)[];
}

export interface StaffPart {
	clef: StaffClef;
	measures: ScoreNote[][];
}

export interface Score {
	keySignature?: string;
	keyAccidentals?: ReadonlyMap<Letter, number>;
	meter?: Meter;
	parts: StaffPart[];
}

export interface Duration {
	code: string;
	dots: number;
	ticks: number;
}

const DURATIONS: readonly Duration[] = [
	{ code: 'w', dots: 0, ticks: 48 },
	{ code: 'h', dots: 1, ticks: 36 },
	{ code: 'h', dots: 0, ticks: 24 },
	{ code: 'q', dots: 1, ticks: 18 },
	{ code: 'q', dots: 0, ticks: 12 },
	{ code: '8', dots: 1, ticks: 9 },
	{ code: '8', dots: 0, ticks: 6 },
	{ code: '16', dots: 0, ticks: 3 }
];

const TRIPLET_EIGHTH: Duration = { code: '8', dots: 0, ticks: 4 };

export function splitTicks(ticks: number, triplet = false): Duration[] {
	if (triplet && ticks === 4) return [TRIPLET_EIGHTH];
	const parts: Duration[] = [];
	let remaining = ticks;
	while (remaining > 0) {
		const fit = DURATIONS.find((duration) => duration.ticks <= remaining);
		if (!fit) break;
		parts.push(fit);
		remaining -= fit.ticks;
	}
	return parts;
}

export interface RenderableNote extends ScoreNote {
	duration: Duration;
	sourceId: string;
}

export function expandMeasure(measure: readonly ScoreNote[]): RenderableNote[] {
	return measure.flatMap((note) => {
		const parts = splitTicks(note.ticks, note.triplet);
		return parts.map((duration, index) => ({
			...note,
			id: index === 0 ? note.id : `${note.id}~${index}`,
			sourceId: note.id,
			ticks: duration.ticks,
			duration,
			tie: index < parts.length - 1 && !note.rest ? true : note.tie,
			below: index === 0 ? note.below : undefined,
			above: index === 0 ? note.above : undefined
		}));
	});
}

export function displayAccidentals(
	measure: readonly ScoreNote[],
	keyAccidentals: ReadonlyMap<Letter, number> = new Map()
): Map<string, (number | null)[]> {
	const state = new Map<string, number>();
	const result = new Map<string, (number | null)[]>();
	for (const note of measure) {
		result.set(
			note.id,
			note.pitches.map((pitch) => {
				const slot = `${pitch.letter}${pitch.octave}`;
				const current = state.get(slot) ?? keyAccidentals.get(pitch.letter) ?? 0;
				if (current === pitch.accidental) return null;
				state.set(slot, pitch.accidental);
				return pitch.accidental;
			})
		);
	}
	return result;
}

export const timeSignatureText = (meter: Meter): string => `${meter.beats}/${meter.unit}`;

export function measuresPerLine(width: number, total: number, preferred = 4): number {
	const fit = Math.max(1, Math.floor(width / 190));
	return Math.max(1, Math.min(preferred, fit, total));
}
