import type { Level } from './levels';
import {
	METER_12_8,
	METER_3_4,
	METER_4_4,
	METER_5_8,
	METER_6_8,
	METER_7_8,
	type Meter,
	type RhythmFeature
} from './rhythm';

const features = (...list: RhythmFeature[]): RhythmFeature[] => list;

export interface RhythmReadingLevel {
	meters: Meter[];
	features: RhythmFeature[];
	swing: boolean;
	swingRatio: number;
	tempo: number;
	bars: number;
}

export const RHYTHM_READING_LEVELS: Record<Level, RhythmReadingLevel> = {
	1: {
		meters: [METER_4_4],
		features: features('quarters', 'halves', 'eighths'),
		swing: false,
		swingRatio: 1,
		tempo: 80,
		bars: 4
	},
	2: {
		meters: [METER_4_4],
		features: features('quarters', 'halves', 'eighths', 'rests'),
		swing: false,
		swingRatio: 1,
		tempo: 88,
		bars: 4
	},
	3: {
		meters: [METER_4_4, METER_3_4],
		features: features('quarters', 'halves', 'eighths', 'rests', 'syncopation'),
		swing: true,
		swingRatio: 1.5,
		tempo: 100,
		bars: 8
	},
	4: {
		meters: [METER_4_4, METER_3_4],
		features: features('quarters', 'halves', 'eighths', 'rests', 'syncopation', 'ties'),
		swing: true,
		swingRatio: 2,
		tempo: 112,
		bars: 8
	},
	5: {
		meters: [METER_4_4],
		features: features('quarters', 'halves', 'eighths', 'rests', 'syncopation', 'ties', 'dotted'),
		swing: true,
		swingRatio: 2,
		tempo: 126,
		bars: 8
	},
	6: {
		meters: [METER_4_4, METER_12_8],
		features: features(
			'quarters',
			'halves',
			'eighths',
			'rests',
			'syncopation',
			'ties',
			'dotted',
			'triplets'
		),
		swing: true,
		swingRatio: 2,
		tempo: 138,
		bars: 8
	},
	7: {
		meters: [METER_4_4, METER_12_8],
		features: features(
			'quarters',
			'halves',
			'eighths',
			'rests',
			'syncopation',
			'ties',
			'dotted',
			'triplets',
			'sixteenths'
		),
		swing: true,
		swingRatio: 2,
		tempo: 152,
		bars: 16
	},
	8: {
		meters: [METER_4_4, METER_6_8],
		features: features(
			'quarters',
			'halves',
			'eighths',
			'rests',
			'syncopation',
			'ties',
			'dotted',
			'triplets',
			'sixteenths'
		),
		swing: true,
		swingRatio: 2.5,
		tempo: 176,
		bars: 16
	},
	9: {
		meters: [METER_4_4, METER_5_8, METER_7_8],
		features: features(
			'quarters',
			'halves',
			'eighths',
			'rests',
			'syncopation',
			'ties',
			'dotted',
			'triplets',
			'sixteenths'
		),
		swing: true,
		swingRatio: 2.5,
		tempo: 200,
		bars: 16
	},
	10: {
		meters: [METER_4_4, METER_5_8, METER_7_8],
		features: features(
			'quarters',
			'halves',
			'eighths',
			'rests',
			'syncopation',
			'ties',
			'dotted',
			'triplets',
			'sixteenths'
		),
		swing: true,
		swingRatio: 3,
		tempo: 60,
		bars: 16
	}
};

export const POLYRHYTHM_LEVELS: Record<
	Level,
	{ ratios: [number, number][]; tempo: number; modulation: boolean }
> = {
	1: { ratios: [[3, 2]], tempo: 60, modulation: false },
	2: {
		ratios: [
			[3, 2],
			[2, 3]
		],
		tempo: 66,
		modulation: false
	},
	3: {
		ratios: [
			[3, 2],
			[2, 3],
			[4, 3]
		],
		tempo: 66,
		modulation: false
	},
	4: {
		ratios: [
			[4, 3],
			[3, 4]
		],
		tempo: 72,
		modulation: true
	},
	5: {
		ratios: [
			[4, 3],
			[3, 4],
			[5, 4]
		],
		tempo: 72,
		modulation: true
	},
	6: {
		ratios: [
			[5, 4],
			[4, 5],
			[5, 3]
		],
		tempo: 66,
		modulation: true
	},
	7: {
		ratios: [
			[5, 3],
			[5, 2],
			[3, 5]
		],
		tempo: 60,
		modulation: true
	},
	8: {
		ratios: [
			[5, 2],
			[7, 4],
			[4, 7]
		],
		tempo: 60,
		modulation: true
	},
	9: {
		ratios: [
			[7, 4],
			[7, 5],
			[5, 7]
		],
		tempo: 56,
		modulation: true
	},
	10: {
		ratios: [
			[7, 5],
			[7, 6],
			[11, 8]
		],
		tempo: 52,
		modulation: true
	}
};
