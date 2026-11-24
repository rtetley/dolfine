import type { Level } from './levels';
import type { RangeKind } from './melody';
import {
	METER_12_8,
	METER_2_4,
	METER_3_4,
	METER_4_4,
	METER_5_8,
	METER_6_8,
	METER_7_8,
	type Meter,
	type RhythmFeature
} from './rhythm';

const features = (...list: RhythmFeature[]): RhythmFeature[] => list;

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
}

export const SIGHT_READING_LEVELS: Record<Level, SightReadingLevel> = {
	1: {
		maxFifths: 1,
		meters: [METER_4_4, METER_3_4],
		bars: 4,
		features: features('quarters', 'halves'),
		maxLeap: 1,
		accidentalRate: 0,
		range: 'staff',
		tempo: 60,
		toleranceMs: 160,
		referenceNotes: true,
		previewSeconds: 30
	},
	2: {
		maxFifths: 2,
		meters: [METER_4_4, METER_3_4, METER_2_4],
		bars: 8,
		features: features('quarters', 'halves', 'eighths'),
		maxLeap: 2,
		accidentalRate: 0,
		range: 'staff',
		tempo: 66,
		toleranceMs: 148,
		referenceNotes: true,
		previewSeconds: 30
	},
	3: {
		maxFifths: 3,
		meters: [METER_4_4, METER_3_4, METER_2_4],
		bars: 8,
		features: features('quarters', 'halves', 'eighths', 'rests'),
		maxLeap: 3,
		accidentalRate: 0.02,
		range: 'ledger',
		tempo: 72,
		toleranceMs: 136,
		referenceNotes: true,
		previewSeconds: 30
	},
	4: {
		maxFifths: 4,
		meters: [METER_4_4, METER_3_4, METER_6_8],
		bars: 8,
		features: features('quarters', 'halves', 'eighths', 'rests', 'dotted'),
		maxLeap: 3,
		accidentalRate: 0.04,
		range: 'ledger',
		tempo: 76,
		toleranceMs: 124,
		referenceNotes: false,
		previewSeconds: 30
	},
	5: {
		maxFifths: 4,
		meters: [METER_4_4, METER_3_4, METER_6_8],
		bars: 8,
		features: features('quarters', 'halves', 'eighths', 'rests', 'dotted', 'sixteenths', 'ties'),
		maxLeap: 4,
		accidentalRate: 0.06,
		range: 'ledger',
		tempo: 80,
		toleranceMs: 112,
		referenceNotes: false,
		previewSeconds: 30
	},
	6: {
		maxFifths: 5,
		meters: [METER_4_4, METER_3_4, METER_6_8, METER_12_8],
		bars: 8,
		features: features(
			'quarters',
			'halves',
			'eighths',
			'rests',
			'dotted',
			'sixteenths',
			'ties',
			'triplets'
		),
		maxLeap: 4,
		accidentalRate: 0.08,
		range: 'ledger',
		tempo: 84,
		toleranceMs: 100,
		referenceNotes: false,
		previewSeconds: 30
	},
	7: {
		maxFifths: 6,
		meters: [METER_4_4, METER_3_4, METER_6_8, METER_12_8],
		bars: 16,
		features: features(
			'quarters',
			'halves',
			'eighths',
			'rests',
			'dotted',
			'sixteenths',
			'ties',
			'triplets',
			'syncopation'
		),
		maxLeap: 4,
		accidentalRate: 0.1,
		range: 'full',
		tempo: 88,
		toleranceMs: 88,
		referenceNotes: false,
		previewSeconds: 30
	},
	8: {
		maxFifths: 6,
		meters: [METER_4_4, METER_6_8, METER_5_8],
		bars: 16,
		features: features(
			'quarters',
			'halves',
			'eighths',
			'rests',
			'dotted',
			'sixteenths',
			'ties',
			'triplets',
			'syncopation'
		),
		maxLeap: 4,
		accidentalRate: 0.12,
		range: 'full',
		tempo: 92,
		toleranceMs: 76,
		referenceNotes: false,
		previewSeconds: 30
	},
	9: {
		maxFifths: 7,
		meters: [METER_4_4, METER_5_8, METER_7_8],
		bars: 16,
		features: features(
			'quarters',
			'halves',
			'eighths',
			'rests',
			'dotted',
			'sixteenths',
			'ties',
			'triplets',
			'syncopation'
		),
		maxLeap: 4,
		accidentalRate: 0.15,
		range: 'full',
		tempo: 96,
		toleranceMs: 64,
		referenceNotes: false,
		previewSeconds: 30
	},
	10: {
		maxFifths: 7,
		meters: [METER_4_4, METER_5_8, METER_7_8, METER_12_8],
		bars: 16,
		features: features(
			'quarters',
			'halves',
			'eighths',
			'rests',
			'dotted',
			'sixteenths',
			'ties',
			'triplets',
			'syncopation'
		),
		maxLeap: 4,
		accidentalRate: 0.18,
		range: 'full',
		tempo: 104,
		toleranceMs: 52,
		referenceNotes: false,
		previewSeconds: 30
	}
};
