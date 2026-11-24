import type { Rng } from './random';

export const TICKS_PER_QUARTER = 12;

export interface Meter {
	beats: number;
	unit: 2 | 4 | 8;
}

export interface RhythmEvent {
	ticks: number;
	rest: boolean;
	tie?: boolean;
	triplet?: boolean;
	syllable?: string;
}

export type RhythmFeature =
	| 'quarters'
	| 'eighths'
	| 'halves'
	| 'rests'
	| 'sixteenths'
	| 'dotted'
	| 'triplets'
	| 'syncopation'
	| 'ties';

export const METER_2_4: Meter = { beats: 2, unit: 4 };
export const METER_3_4: Meter = { beats: 3, unit: 4 };
export const METER_4_4: Meter = { beats: 4, unit: 4 };
export const METER_6_8: Meter = { beats: 6, unit: 8 };
export const METER_5_8: Meter = { beats: 5, unit: 8 };
export const METER_7_8: Meter = { beats: 7, unit: 8 };
export const METER_12_8: Meter = { beats: 12, unit: 8 };

export const measureTicks = (meter: Meter): number =>
	(meter.beats * TICKS_PER_QUARTER * 4) / meter.unit;

export const isCompound = (meter: Meter): boolean =>
	meter.unit === 8 && meter.beats % 3 === 0 && meter.beats > 3;

export const beatTicks = (meter: Meter): number =>
	isCompound(meter) ? (TICKS_PER_QUARTER * 3) / 2 : (TICKS_PER_QUARTER * 4) / meter.unit;

type Cell = readonly RhythmEvent[];

const note = (ticks: number, extra: Partial<RhythmEvent> = {}): RhythmEvent => ({
	ticks,
	rest: false,
	...extra
});
const rest = (ticks: number): RhythmEvent => ({ ticks, rest: true });

interface CellOption {
	cell: Cell;
	needs: readonly RhythmFeature[];
	weight: number;
}

const QUARTER_CELLS: readonly CellOption[] = [
	{ cell: [note(12)], needs: ['quarters'], weight: 4 },
	{ cell: [rest(12)], needs: ['rests'], weight: 1 },
	{ cell: [note(6), note(6)], needs: ['eighths'], weight: 4 },
	{ cell: [rest(6), note(6)], needs: ['eighths', 'rests', 'syncopation'], weight: 2 },
	{ cell: [note(9), note(3)], needs: ['dotted', 'sixteenths'], weight: 2 },
	{ cell: [note(3), note(3), note(6)], needs: ['sixteenths'], weight: 2 },
	{ cell: [note(6), note(3), note(3)], needs: ['sixteenths'], weight: 2 },
	{ cell: [note(3), note(3), note(3), note(3)], needs: ['sixteenths'], weight: 1 },
	{ cell: [note(3), note(6), note(3)], needs: ['sixteenths', 'syncopation'], weight: 1 },
	{
		cell: [note(4, { triplet: true }), note(4, { triplet: true }), note(4, { triplet: true })],
		needs: ['triplets'],
		weight: 2
	}
];

const SPAN_CELLS: readonly CellOption[] = [
	{ cell: [note(24)], needs: ['halves'], weight: 3 },
	{ cell: [note(18), note(6)], needs: ['dotted', 'eighths'], weight: 2 },
	{ cell: [note(6), note(12), note(6)], needs: ['eighths', 'syncopation'], weight: 2 },
	{
		cell: [note(6), note(6, { tie: true }), note(6), note(6)],
		needs: ['eighths', 'ties', 'syncopation'],
		weight: 1
	},
	{ cell: [rest(6), note(12), note(6)], needs: ['eighths', 'rests', 'syncopation'], weight: 1 }
];

const COMPOUND_CELLS: readonly CellOption[] = [
	{ cell: [note(18)], needs: ['quarters'], weight: 3 },
	{ cell: [note(12), note(6)], needs: ['quarters', 'eighths'], weight: 4 },
	{ cell: [note(6), note(6), note(6)], needs: ['eighths'], weight: 4 },
	{ cell: [note(6), note(12)], needs: ['eighths', 'syncopation'], weight: 1 },
	{ cell: [rest(6), note(6), note(6)], needs: ['eighths', 'rests'], weight: 1 },
	{ cell: [note(9), note(3), note(6)], needs: ['dotted', 'sixteenths'], weight: 1 }
];

const allowed = (option: CellOption, features: ReadonlySet<RhythmFeature>): boolean =>
	option.needs.every((need) => features.has(need));

export function generateMeasure(
	meter: Meter,
	features: ReadonlySet<RhythmFeature>,
	rng: Rng
): RhythmEvent[] {
	const total = measureTicks(meter);
	const beat = beatTicks(meter);
	const events: RhythmEvent[] = [];
	let position = 0;
	const compound = isCompound(meter);

	while (position < total) {
		const remaining = total - position;
		const spanPool =
			!compound && remaining >= 24 && position % 24 === 0
				? SPAN_CELLS.filter((o) => allowed(o, features))
				: [];
		const beatPool = (compound ? COMPOUND_CELLS : QUARTER_CELLS).filter((o) =>
			allowed(o, features)
		);
		const fallback: CellOption = { cell: [note(Math.min(beat, remaining))], needs: [], weight: 1 };
		const pool = [...spanPool, ...beatPool];
		const choice =
			pool.length > 0
				? rng.weighted(pool.map((option) => [option, option.weight] as const))
				: fallback;
		const cellTicks = choice.cell.reduce((sum, event) => sum + event.ticks, 0);
		const cell = cellTicks <= remaining ? choice.cell : fallback.cell;
		events.push(...cell.map((event) => ({ ...event })));
		position += cell.reduce((sum, event) => sum + event.ticks, 0);
	}
	return events;
}

export function generateRhythm(
	meter: Meter,
	bars: number,
	features: ReadonlySet<RhythmFeature>,
	rng: Rng
): RhythmEvent[][] {
	const measures = Array.from({ length: bars }, () => generateMeasure(meter, features, rng));
	const last = measures.at(-1);
	if (last && features.has('halves') && !isCompound(meter) && measureTicks(meter) >= 24) {
		const total = measureTicks(meter);
		const head = trimToTicks(last, total - 24);
		measures[measures.length - 1] = [...head, note(24)];
	}
	return measures;
}

function trimToTicks(events: readonly RhythmEvent[], limit: number): RhythmEvent[] {
	const kept: RhythmEvent[] = [];
	let position = 0;
	for (const event of events) {
		if (position + event.ticks > limit) break;
		kept.push({ ...event, tie: position + event.ticks === limit ? false : event.tie });
		position += event.ticks;
	}
	if (position < limit) kept.push(rest(limit - position));
	return kept;
}

export const totalTicks = (events: readonly RhythmEvent[]): number =>
	events.reduce((sum, e) => sum + e.ticks, 0);

export interface TimedEvent {
	startTicks: number;
	ticks: number;
	rest: boolean;
	measure: number;
	index: number;
}

export function timeline(
	measures: readonly (readonly RhythmEvent[])[],
	meter: Meter
): TimedEvent[] {
	const perMeasure = measureTicks(meter);
	return measures.flatMap((events, measure) => {
		let position = measure * perMeasure;
		return events.map((event, index) => {
			const timed = { startTicks: position, ticks: event.ticks, rest: event.rest, measure, index };
			position += event.ticks;
			return timed;
		});
	});
}

export function swungSeconds(startTicks: number, bpm: number, swingRatio: number): number {
	const beat = TICKS_PER_QUARTER;
	const beatIndex = Math.floor(startTicks / beat);
	const within = startTicks - beatIndex * beat;
	const swungWithin = within === beat / 2 ? (beat * swingRatio) / (1 + swingRatio) : within;
	return ((beatIndex * beat + swungWithin) / beat) * (60 / bpm);
}

export const GENERIC_SCAT_SYLLABLES = {
	long: 'Doo',
	onBeat: 'Ba',
	offBeat: 'Dah',
	short: 'dl',
	last: 'Bop'
} as const;

export function assignSyllables(
	measures: readonly (readonly RhythmEvent[])[],
	meter: Meter
): RhythmEvent[][] {
	const beat = beatTicks(meter);
	const result = measures.map((events) => {
		let position = 0;
		return events.map((event) => {
			const onBeat = position % beat === 0;
			position += event.ticks;
			if (event.rest) return { ...event };
			const syllable =
				event.ticks >= beat * 2
					? GENERIC_SCAT_SYLLABLES.long
					: event.ticks < TICKS_PER_QUARTER / 2
						? GENERIC_SCAT_SYLLABLES.short
						: onBeat
							? GENERIC_SCAT_SYLLABLES.onBeat
							: GENERIC_SCAT_SYLLABLES.offBeat;
			return { ...event, syllable };
		});
	});
	const lastMeasure = result.at(-1);
	const lastNote = lastMeasure?.findLast((event) => !event.rest);
	if (lastNote) lastNote.syllable = GENERIC_SCAT_SYLLABLES.last;
	return result;
}
