import type { Level } from './levels';
import type { Clef, RangeKind } from './melody';
import { letterAt, letterIndex, type Letter } from './pitch';
import {
	METER_12_8,
	METER_2_4,
	METER_3_4,
	METER_4_4,
	METER_5_8,
	METER_6_8,
	METER_7_8,
	type Meter,
	type RhythmFeature,
	type UniformValue
} from './rhythm';

/**
 * Sight-reading levels, after Dandelot's method: first the notes themselves, from a few
 * landmarks outwards (levels 1–4), then one rhythmic value at a time with every note the same
 * length (5–8), then free rhythms introduced one figure at a time (9), and everything (10).
 * Each level's "focus" drill trains the new element; its "review" drill mixes it freely with
 * everything met so far, as the end-of-chapter exercises do.
 */

export type SightReadingDrill = 'focus' | 'review' | 'dotted' | 'syncopation' | 'compound';

/**
 * Which staff positions a level reads: the landmark notes, then with their neighbours (a step
 * away), with their thirds, or both. Without one, any note in the range.
 */
export type PitchSet = 'landmarks' | 'neighbours' | 'thirds' | 'near';

export interface SightReadingLevel {
	maxFifths: number;
	meters: Meter[];
	bars: number;
	features: RhythmFeature[];
	maxLeap: number;
	accidentalRate: number;
	range: RangeKind;
	tempo: number;
	toleranceMs: number;
	referenceNotes: boolean;
	previewSeconds: number;
	pitches?: PitchSet;
	/** Only these moves, in scale steps: 3 a fourth, 4 a fifth, 5 a sixth, 7 an octave. */
	moves?: number[];
	uniform?: UniformValue;
}

/** Dandelot's landmarks: the C and G of the treble clef, the C and F of the bass clef. */
export const LANDMARKS: Record<Clef, readonly string[]> = {
	treble: ['C4', 'G4', 'C5', 'G5'],
	bass: ['F2', 'C3', 'F3', 'C4']
};

const STEPS: Record<PitchSet, readonly number[]> = {
	landmarks: [0],
	neighbours: [0, 1, -1],
	thirds: [0, 2, -2],
	near: [0, 1, -1, 2, -2]
};

const diatonic = (position: string): number =>
	Number(position.slice(1)) * 7 + letterIndex(position[0] as Letter);

const position = (step: number): string => `${letterAt(step)}${Math.floor(step / 7)}`;

/** The staff positions a pitch set allows on a clef, as letter and octave ("C4"). */
export const pitchPool = (clef: Clef, set: PitchSet): string[] => [
	...new Set(
		LANDMARKS[clef].flatMap((landmark) =>
			STEPS[set].map((step) => position(diatonic(landmark) + step))
		)
	)
];

const SIMPLE = [METER_4_4, METER_3_4, METER_2_4];
const BASIC = ['quarters', 'halves'] as const satisfies RhythmFeature[];
const WITH_EIGHTHS = [...BASIC, 'eighths', 'rests'] as const satisfies RhythmFeature[];
const WITH_TRIPLETS = [...WITH_EIGHTHS, 'triplets'] as const satisfies RhythmFeature[];
const WITH_SIXTEENTHS = [...WITH_TRIPLETS, 'sixteenths'] as const satisfies RhythmFeature[];
const WITH_SIXTEENTH_TRIPLETS = [
	...WITH_SIXTEENTHS,
	'sixteenthTriplets'
] as const satisfies RhythmFeature[];
const FREE = [
	...WITH_SIXTEENTH_TRIPLETS,
	'dotted',
	'ties',
	'syncopation'
] as const satisfies RhythmFeature[];

const content = (
	settings: Partial<SightReadingLevel> & Pick<SightReadingLevel, 'tempo' | 'toleranceMs'>
): SightReadingLevel => ({
	maxFifths: 0,
	meters: [METER_4_4],
	bars: 6,
	features: [...BASIC],
	maxLeap: 2,
	accidentalRate: 0,
	range: 'ledger',
	referenceNotes: false,
	previewSeconds: 30,
	...settings
});

/** The content of each drill, by level. A level's first drill is where it opens. */
export const SIGHT_READING_DRILLS: Record<
	Level,
	Partial<Record<SightReadingDrill, SightReadingLevel>>
> = {
	1: {
		focus: content({
			pitches: 'landmarks',
			bars: 4,
			tempo: 60,
			toleranceMs: 160,
			referenceNotes: true
		})
	},
	2: {
		focus: content({
			pitches: 'neighbours',
			meters: [METER_4_4, METER_3_4],
			tempo: 60,
			toleranceMs: 156,
			referenceNotes: true
		}),
		review: content({
			pitches: 'neighbours',
			meters: SIMPLE,
			bars: 8,
			features: [...BASIC, 'rests'],
			tempo: 60,
			toleranceMs: 156,
			referenceNotes: true
		})
	},
	3: {
		focus: content({
			pitches: 'thirds',
			meters: [METER_4_4, METER_3_4],
			tempo: 60,
			toleranceMs: 152,
			referenceNotes: true
		}),
		review: content({
			pitches: 'near',
			meters: SIMPLE,
			bars: 8,
			features: [...BASIC, 'rests'],
			tempo: 63,
			toleranceMs: 152,
			referenceNotes: true
		})
	},
	4: {
		focus: content({ moves: [3, 4, 5, 7], tempo: 56, toleranceMs: 148 }),
		review: content({
			maxLeap: 7,
			maxFifths: 1,
			meters: SIMPLE,
			bars: 8,
			features: [...BASIC, 'rests'],
			tempo: 63,
			toleranceMs: 144
		})
	},
	5: {
		focus: content({
			uniform: 'eighths',
			maxFifths: 1,
			meters: SIMPLE,
			tempo: 60,
			toleranceMs: 136
		}),
		review: content({
			maxLeap: 5,
			maxFifths: 1,
			meters: SIMPLE,
			bars: 8,
			features: [...WITH_EIGHTHS],
			tempo: 66,
			toleranceMs: 130
		})
	},
	6: {
		focus: content({
			uniform: 'triplets',
			maxFifths: 1,
			meters: SIMPLE,
			tempo: 56,
			toleranceMs: 124
		}),
		review: content({
			maxLeap: 5,
			maxFifths: 2,
			meters: SIMPLE,
			bars: 8,
			features: [...WITH_TRIPLETS],
			tempo: 66,
			toleranceMs: 118
		})
	},
	7: {
		focus: content({
			uniform: 'sixteenths',
			maxFifths: 2,
			meters: [METER_4_4, METER_2_4],
			bars: 4,
			tempo: 50,
			toleranceMs: 112
		}),
		review: content({
			maxLeap: 5,
			maxFifths: 2,
			meters: SIMPLE,
			bars: 8,
			features: [...WITH_SIXTEENTHS],
			tempo: 66,
			toleranceMs: 106,
			accidentalRate: 0.02
		})
	},
	8: {
		focus: content({
			uniform: 'sixteenthTriplets',
			maxLeap: 1,
			maxFifths: 2,
			meters: [METER_2_4, METER_4_4],
			bars: 4,
			tempo: 44,
			toleranceMs: 100
		}),
		review: content({
			maxLeap: 5,
			maxFifths: 3,
			meters: SIMPLE,
			bars: 8,
			features: [...WITH_SIXTEENTH_TRIPLETS],
			tempo: 60,
			toleranceMs: 96,
			accidentalRate: 0.03
		})
	},
	9: {
		dotted: content({
			maxLeap: 4,
			maxFifths: 3,
			meters: SIMPLE,
			bars: 8,
			features: [...WITH_EIGHTHS, 'dotted', 'sixteenths'],
			tempo: 66,
			toleranceMs: 92
		}),
		syncopation: content({
			maxLeap: 4,
			maxFifths: 3,
			meters: SIMPLE,
			bars: 8,
			features: [...WITH_EIGHTHS, 'syncopation', 'ties'],
			tempo: 66,
			toleranceMs: 92
		}),
		compound: content({
			maxLeap: 4,
			maxFifths: 3,
			meters: [METER_6_8, METER_12_8],
			bars: 8,
			features: [...WITH_EIGHTHS, 'dotted', 'sixteenths'],
			tempo: 60,
			toleranceMs: 92
		}),
		review: content({
			maxLeap: 7,
			maxFifths: 4,
			meters: [...SIMPLE, METER_6_8],
			bars: 8,
			features: [...FREE],
			tempo: 72,
			toleranceMs: 88,
			accidentalRate: 0.05
		})
	},
	10: {
		review: content({
			maxLeap: 7,
			maxFifths: 6,
			meters: [...SIMPLE, METER_6_8, METER_12_8, METER_5_8, METER_7_8],
			bars: 16,
			features: [...FREE],
			range: 'full',
			tempo: 80,
			toleranceMs: 80,
			accidentalRate: 0.1
		})
	}
};

export const drillsAt = (level: Level): SightReadingDrill[] =>
	Object.keys(SIGHT_READING_DRILLS[level]).filter((drill): drill is SightReadingDrill =>
		isSightReadingDrill(drill)
	);

export const isSightReadingDrill = (value: unknown): value is SightReadingDrill =>
	value === 'focus' ||
	value === 'review' ||
	value === 'dotted' ||
	value === 'syncopation' ||
	value === 'compound';

/** A drill's content, or the level's first drill if this level doesn't have that one. */
export function readingContent(level: Level, drill: SightReadingDrill): SightReadingLevel {
	const drills = SIGHT_READING_DRILLS[level];
	const content = drills[drill] ?? drills[drillsAt(level)[0]];
	if (!content) throw new Error(`Sight-reading level ${level} has no drills`);
	return content;
}
