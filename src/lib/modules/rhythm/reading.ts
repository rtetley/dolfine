import { m } from '#lib/i18n.ts';
import type { Level } from '#lib/music/levels.ts';
import { POLYRHYTHM_LEVELS, RHYTHM_READING_LEVELS } from '#lib/music/rhythmLevels.ts';
import { createRng } from '#lib/music/random.ts';
import {
	assignSyllables,
	generateRhythm,
	type Meter,
	type RhythmEvent,
	swungSeconds,
	timeline
} from '#lib/music/rhythm.ts';
import type { Score } from '#lib/notation/model.ts';
import type { ScheduledChord } from '#lib/audio/engine.ts';

export type Feel = 'level' | 'straight' | 'swing';
export type SyllableMode = 'on' | 'off' | 'fade';

export interface RhythmPrefs extends Record<string, unknown> {
	submodule: 'reading' | 'polyrhythm';
	level: Level;
	feel: Feel;
	swingRatio: number;
	tempo: number;
	meter: string;
	bars: number;
	syllables: SyllableMode;
	metronome: 'on' | 'off' | 'random-mute';
	subdivision: number;
	twoAndFour: boolean;
	ratio: string;
	sound: string;
	composite: boolean;
	modulation: boolean;
}

export const RHYTHM_DEFAULTS: RhythmPrefs = {
	submodule: 'reading',
	level: 2,
	feel: 'level',
	swingRatio: 0,
	tempo: 0,
	meter: 'level',
	bars: 0,
	syllables: 'on',
	metronome: 'on',
	subdivision: 1,
	twoAndFour: false,
	ratio: 'level',
	sound: 'both',
	composite: true,
	modulation: false
};

export interface RhythmExercise {
	seed: number;
	meter: Meter;
	bars: number;
	tempo: number;
	swing: boolean;
	swingRatio: number;
	measures: RhythmEvent[][];
}

const parseMeter = (text: string): Meter | null => {
	const match = /^(\d+)\/(2|4|8)$/.exec(text);
	return match ? { beats: Number(match[1]), unit: Number(match[2]) as Meter['unit'] } : null;
};

export function createRhythmExercise(prefs: RhythmPrefs, seed: number): RhythmExercise {
	const rng = createRng(seed);
	const level = RHYTHM_READING_LEVELS[prefs.level];
	const meter = parseMeter(prefs.meter) ?? rng.pick(level.meters);
	const bars = prefs.bars > 0 ? prefs.bars : level.bars;
	const swing = (prefs.feel === 'level' ? level.swing : prefs.feel === 'swing') && meter.unit === 4;
	const swingRatio = swing
		? prefs.swingRatio > 0
			? prefs.swingRatio
			: Math.max(level.swingRatio, 1.5)
		: 1;
	const measures = assignSyllables(
		generateRhythm(meter, bars, new Set(level.features), rng),
		meter
	);
	return {
		seed,
		meter,
		bars,
		tempo: prefs.tempo > 0 ? prefs.tempo : level.tempo,
		swing,
		swingRatio,
		measures
	};
}

const PERCUSSION_PITCH = { letter: 'B', accidental: 0, octave: 4 } as const;

export function rhythmScore(exercise: RhythmExercise, syllables: SyllableMode): Score {
	const fadeFrom = Math.ceil(exercise.bars / 2);
	return {
		meter: exercise.meter,
		parts: [
			{
				clef: 'percussion',
				measures: exercise.measures.map((measure, bar) =>
					measure.map((event, n) => ({
						id: `r${bar}-${n}`,
						ticks: event.ticks,
						rest: event.rest,
						pitches: event.rest ? [] : [PERCUSSION_PITCH],
						tie: event.tie,
						triplet: event.triplet,
						above:
							bar === 0 && n === 0
								? exercise.swing
									? m.score_swing({ ratio: ratioLabel(exercise.swingRatio) })
									: m.score_straight()
								: undefined,
						below:
							syllables === 'off' || (syllables === 'fade' && bar >= fadeFrom)
								? undefined
								: event.syllable
					}))
				)
			}
		]
	};
}

export const ratioLabel = (ratio: number): string =>
	ratio === 2 ? m.ratio_triplet() : `${ratio}:1`;

export function listenSchedule(exercise: RhythmExercise, midi = 72): ScheduledChord[] {
	const events = timeline(exercise.measures, exercise.meter);
	const tieInto = new Set<number>();
	const flat = exercise.measures.flat();
	flat.forEach((event, i) => {
		if (event.tie) tieInto.add(i + 1);
	});
	return events.flatMap((event, i) => {
		if (event.rest || tieInto.has(i)) return [];
		const at = swungSeconds(event.startTicks, exercise.tempo, exercise.swingRatio);
		return [{ midis: [midi], at, duration: 0.18 }];
	});
}

export function chooseRatio(prefs: RhythmPrefs, seed: number): [number, number] {
	const match = /^(\d+):(\d+)$/.exec(prefs.ratio);
	if (match) return [Number(match[1]), Number(match[2])];
	return createRng(seed).pick(POLYRHYTHM_LEVELS[prefs.level].ratios);
}

export const RATIO_OPTIONS = [
	'level',
	'3:2',
	'2:3',
	'4:3',
	'3:4',
	'5:4',
	'4:5',
	'5:3',
	'5:2',
	'7:4',
	'7:5'
] as const;
