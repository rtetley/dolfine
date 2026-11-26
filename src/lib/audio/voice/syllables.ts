import { analyseFrames, ANALYSIS_RATE, frameTime, resample } from './signal';

/** Finds the spoken syllables in a recording, timed at their vowel, with features to classify them. */

const VOICED = 0.45;
const ABOVE_FLOOR_DB = 12;
/** A fluent reading is voiced almost throughout, so the quietest frames may still be speech. */
const BELOW_LOUDEST_DB = 25;
const ABSOLUTE_FLOOR_DB = -60;
const BRIDGE_FRAMES = 3;
/** Longer than a metronome click, which is short but periodic enough to look voiced. */
const MIN_FRAMES = 8;
const VALLEY_DB = 6;
const CHANGE_SPAN = 2;
/** How much faster the spectrum must change than in the stretch's steady parts to mark a new name. */
const CHANGE_RATIO = 4;
const ONSET_BELOW_PEAK_DB = 10;
const CONSONANT_FRAMES = 8;
const MAX_FEATURE_FRAMES = 40;

export interface Region {
	start: number;
	end: number;
}

export interface Syllable {
	/** Seconds from the start of the recording to the vowel onset. */
	time: number;
	features: Float32Array[];
}

function percentile(values: Float32Array, fraction: number): number {
	if (values.length === 0) return ABSOLUTE_FLOOR_DB;
	const sorted = Float32Array.from(values).sort();
	return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))];
}

const peakOf = (energy: Float32Array, start: number, end: number): number => {
	let peak = -Infinity;
	for (let i = start; i < end; i++) peak = Math.max(peak, energy[i]);
	return peak;
};

/** Splits a voiced stretch at its deepest dip, so "do-ré" said legato still counts as two names. */
function splitAtValleys(energy: Float32Array, region: Region): Region[] {
	let valley = -1;
	let depth = 0;
	for (let i = region.start + 2; i < region.end - 2; i++) {
		const rise = Math.min(peakOf(energy, region.start, i), peakOf(energy, i + 1, region.end));
		const drop = rise - energy[i];
		if (drop >= VALLEY_DB && drop > depth) {
			valley = i;
			depth = drop;
		}
	}
	if (valley < 0) return [region];
	return [
		...splitAtValleys(energy, { start: region.start, end: valley }),
		...splitAtValleys(energy, { start: valley + 1, end: region.end })
	];
}

/** How fast the spectrum changes around each frame. */
export function spectralChange(mfcc: readonly Float32Array[]): Float32Array {
	const change = new Float32Array(mfcc.length);
	for (let i = CHANGE_SPAN; i + CHANGE_SPAN < mfcc.length; i++) {
		const [before, after] = [mfcc[i - CHANGE_SPAN], mfcc[i + CHANGE_SPAN]];
		change[i] = Math.hypot(...after.map((value, k) => value - before[k]));
	}
	return change;
}

/**
 * Names said legato through a voiced consonant ("ré-mi", "sol-la") barely dip in loudness, but the
 * spectrum jumps between their vowels. Splits at the sharpest jump, relative to the steady parts.
 */
function splitAtChanges(change: Float32Array, region: Region): Region[] {
	const inner = change.slice(region.start + MIN_FRAMES, region.end - MIN_FRAMES);
	if (inner.length === 0) return [region];
	const steady = percentile(change.slice(region.start, region.end), 0.5);
	const at = region.start + MIN_FRAMES + inner.indexOf(Math.max(...inner));
	if (change[at] <= steady * CHANGE_RATIO) return [region];
	return [
		...splitAtChanges(change, { start: region.start, end: at }),
		...splitAtChanges(change, { start: at, end: region.end })
	];
}

/** Voiced, loud-enough stretches of frames, as half-open [start, end) ranges. */
export function voicedRegions(
	energyDb: Float32Array,
	voicing: Float32Array,
	change: Float32Array = new Float32Array(energyDb.length)
): Region[] {
	const threshold = Math.max(
		Math.min(
			percentile(energyDb, 0.2) + ABOVE_FLOOR_DB,
			percentile(energyDb, 0.95) - BELOW_LOUDEST_DB
		),
		ABSOLUTE_FLOOR_DB
	);
	const regions: Region[] = [];
	let current: Region | null = null;
	for (let i = 0; i < energyDb.length; i++) {
		if (energyDb[i] <= threshold || voicing[i] < VOICED) continue;
		if (current && i - current.end <= BRIDGE_FRAMES) current.end = i + 1;
		else {
			current = { start: i, end: i + 1 };
			regions.push(current);
		}
	}
	return regions
		.flatMap((region) => splitAtValleys(energyDb, region))
		.flatMap((region) => splitAtChanges(change, region))
		.filter((region) => region.end - region.start >= MIN_FRAMES);
}

/**
 * A syllable is heard where its vowel starts (its perceptual centre), not at the consonant.
 * The first frame within a few dB of the stretch's peak is a stable estimate of that point.
 */
export function vowelOnset(energyDb: Float32Array, region: Region): number {
	const peak = peakOf(energyDb, region.start, region.end);
	for (let i = region.start; i < region.end; i++) {
		if (energyDb[i] >= peak - ONSET_BELOW_PEAK_DB) return i;
	}
	return region.start;
}

export function findSyllables(samples: Float32Array, sampleRate: number): Syllable[] {
	const signal = resample(samples, sampleRate, ANALYSIS_RATE);
	const { energyDb, voicing, mfcc } = analyseFrames(signal);
	const regions = voicedRegions(energyDb, voicing, spectralChange(mfcc));
	return regions.map((region, index) => {
		const previousEnd = index > 0 ? regions[index - 1].end : 0;
		const start = Math.max(previousEnd, region.start - CONSONANT_FRAMES);
		const end = Math.min(region.end, start + MAX_FEATURE_FRAMES);
		return { time: frameTime(vowelOnset(energyDb, region)), features: mfcc.slice(start, end) };
	});
}
