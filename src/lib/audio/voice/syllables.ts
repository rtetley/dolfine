import {
	analyseFrames,
	ANALYSIS_RATE,
	FRAME,
	type Frames,
	frameTime,
	HOP,
	resample
} from './signal';

/** Finds the spoken syllables in a recording, timed at their vowel, with features to classify them. */

const VOICED = 0.45;
const ABOVE_FLOOR_DB = 12;
/** A fluent reading is voiced almost throughout, so the quietest frames may still be speech. */
const BELOW_LOUDEST_DB = 25;
const ABSOLUTE_FLOOR_DB = -60;
const BRIDGE_FRAMES = 3;
/** Longer than a metronome click, which is short but periodic enough to look voiced. */
const MIN_FRAMES = 8;
/**
 * A voice keeps much of its energy below 1 kHz (its pitch and first formant); a metronome click
 * heard through the speakers rings well above it, long and periodic enough to pass for a vowel.
 */
const LOW_BAND_SHARE = 0.3;
/** Names come at most five a second, so two onsets this close are one name heard twice. */
const MIN_GAP_FRAMES = 12;
/** How far from a note the score expects a name, when looking for one that was not split off. */
const RESCUE_FRAMES = 15;
const VALLEY_DB = 6;
const CHANGE_SPAN = 2;
/** How much faster the spectrum must change than in the stretch's steady parts to mark a new name. */
const CHANGE_RATIO = 4;
/** The calmest quarter of a stretch: a short name is mostly transitions. */
const STEADY_PERCENTILE = 0.25;
/** Above the ripple of a held vowel, even sung with vibrato; below any jump into another sound. */
const MIN_JUMP = 30;
const SPLIT_LOUDNESS_DB = 6;
const ONSET_BELOW_PEAK_DB = 10;
/** A jump into a vowel lands near full loudness; the fade at the end of a name falls away. */
const VOWEL_BELOW_PEAK_DB = 6;
/** How far into a stretch a voiced consonant can run before its vowel. */
const CONSONANT_SEARCH_FRAMES = 15;
/**
 * A name is recognised from a fixed window around its vowel onset: the consonant, which is all
 * that tells "ré" from "mi" or "fa" from "la", and the start of the vowel, not all of a held one.
 */
const CONSONANT_FRAMES = 10;
const VOWEL_FRAMES = 15;

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

const jumpThreshold = (change: Float32Array, region: Region): number =>
	Math.max(
		percentile(change.slice(region.start, region.end), STEADY_PERCENTILE) * CHANGE_RATIO,
		MIN_JUMP
	);

const isPeak = (change: Float32Array, i: number): boolean =>
	change[i] >= change[i - 1] && change[i] >= change[i + 1];

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
 * spectrum jumps between their vowels. Splits at the sharpest jump, relative to the steady parts,
 * with a vowel on each side: a voiced consonant (the l closing "sol") or the fade of a held name
 * is a jump too, but quieter than any vowel.
 */
function splitAtChanges(energyDb: Float32Array, change: Float32Array, region: Region): Region[] {
	const threshold = jumpThreshold(change, region);
	const vowelOnBothSides = (at: number): boolean =>
		Math.abs(
			peakOf(energyDb, at + CHANGE_SPAN, region.end) -
				peakOf(energyDb, region.start, at - CHANGE_SPAN)
		) <= SPLIT_LOUDNESS_DB;
	const at = Array.from({ length: region.end - region.start - 2 * MIN_FRAMES }, (_, i) => {
		const frame = region.start + MIN_FRAMES + i;
		return { frame, change: change[frame] };
	})
		.filter(
			({ frame, change: jump }) =>
				jump > threshold && isPeak(change, frame) && vowelOnBothSides(frame)
		)
		.sort((a, b) => b.change - a.change)[0]?.frame;
	if (at === undefined) return [region];
	return [
		...splitAtChanges(energyDb, change, { start: region.start, end: at }),
		...splitAtChanges(energyDb, change, { start: at, end: region.end })
	];
}

export type FrameTrack = Pick<Frames, 'energyDb' | 'voicing' | 'lowBand'>;

/** Voiced, loud-enough stretches of frames, as half-open [start, end) ranges. */
export function voicedRegions(
	{ energyDb, voicing, lowBand }: FrameTrack,
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
		if (energyDb[i] <= threshold || voicing[i] < VOICED || lowBand[i] < LOW_BAND_SHARE) continue;
		if (current && i - current.end <= BRIDGE_FRAMES) current.end = i + 1;
		else {
			current = { start: i, end: i + 1 };
			regions.push(current);
		}
	}
	return regions
		.flatMap((region) => splitAtValleys(energyDb, region))
		.flatMap((region) => splitAtChanges(energyDb, change, region))
		.filter((region) => region.end - region.start >= MIN_FRAMES);
}

/**
 * A syllable is heard where its vowel starts (its perceptual centre), not at the consonant. That is
 * the first frame within a few dB of the stretch's peak, unless the spectrum jumps later on, from a
 * voiced consonant into the vowel. A voiced consonant like the l of "la" is sometimes nearly as loud
 * as the vowel and sometimes cut off by a dip: the jump times the name the same way in both cases.
 */
export function vowelOnset(energyDb: Float32Array, change: Float32Array, region: Region): number {
	const peak = peakOf(energyDb, region.start, region.end);
	let loud = region.start;
	while (loud < region.end - 1 && energyDb[loud] < peak - ONSET_BELOW_PEAK_DB) loud++;
	let jump = -1;
	let strongest = jumpThreshold(change, region);
	const last = Math.min(region.end, region.start + CONSONANT_SEARCH_FRAMES);
	for (let i = region.start + 2 * CHANGE_SPAN; i < last; i++) {
		const intoVowel =
			energyDb[Math.min(i + CHANGE_SPAN, region.end - 1)] >= peak - VOWEL_BELOW_PEAK_DB;
		if (isPeak(change, i) && intoVowel && change[i] > strongest) {
			strongest = change[i];
			jump = i;
		}
	}
	return Math.max(loud, jump);
}

/** Merges stretches whose vowels start too close together to be two names. */
function mergeClose(energyDb: Float32Array, change: Float32Array, regions: Region[]): Region[] {
	const merged: Region[] = [];
	for (const region of regions) {
		const previous = merged.at(-1);
		const close =
			previous &&
			region.start - previous.end <= BRIDGE_FRAMES &&
			vowelOnset(energyDb, change, region) - vowelOnset(energyDb, change, previous) <
				MIN_GAP_FRAMES;
		if (previous && close) previous.end = region.end;
		else merged.push({ ...region });
	}
	return merged;
}

/**
 * Where the score expects a name and none was found, the name may have run into the one before
 * without a clear enough jump. Splits there at the strongest change, against a lower bar.
 */
function rescue(
	energyDb: Float32Array,
	change: Float32Array,
	regions: Region[],
	expectedFrames: readonly number[]
): Region[] {
	const result = regions.map((region) => ({ ...region }));
	for (const due of expectedFrames) {
		const heard = result.some(
			(region) => Math.abs(vowelOnset(energyDb, change, region) - due) <= RESCUE_FRAMES
		);
		const index = result.findIndex((region) => region.start < due && due < region.end);
		if (heard || index < 0) continue;
		const region = result[index];
		const from = Math.max(region.start + MIN_FRAMES, due - RESCUE_FRAMES);
		const to = Math.min(region.end - MIN_FRAMES, due + RESCUE_FRAMES);
		const bar = jumpThreshold(change, region) / 2;
		let at = -1;
		for (let i = from; i <= to; i++) {
			if (isPeak(change, i) && change[i] > bar && (at < 0 || change[i] > change[at])) at = i;
		}
		if (at < 0) continue;
		result.splice(index, 1, { start: region.start, end: at }, { start: at, end: region.end });
	}
	return result;
}

const toFrame = (seconds: number): number =>
	Math.round((seconds * ANALYSIS_RATE - FRAME / 2) / HOP);

/**
 * `expected` are the times, in seconds on the recording's clock, at which the score expects a
 * vowel. They only help find names said legato; they never decide which name was said.
 */
export function findSyllables(
	samples: Float32Array,
	sampleRate: number,
	expected: readonly number[] = []
): Syllable[] {
	const signal = resample(samples, sampleRate, ANALYSIS_RATE);
	const frames = analyseFrames(signal);
	const { energyDb, mfcc } = frames;
	const change = spectralChange(mfcc);
	const regions = rescue(
		energyDb,
		change,
		mergeClose(energyDb, change, voicedRegions(frames, change)),
		expected.map(toFrame)
	);
	const onsets = regions.map((region) => vowelOnset(energyDb, change, region));
	return regions.map((region, index) => {
		const onset = onsets[index];
		const start = Math.max(index > 0 ? onsets[index - 1] + 1 : 0, onset - CONSONANT_FRAMES);
		const end = Math.max(start + 1, Math.min(region.end, onset + VOWEL_FRAMES));
		return { time: frameTime(onset), features: mfcc.slice(start, end) };
	});
}
