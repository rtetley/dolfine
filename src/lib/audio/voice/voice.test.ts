import { describe, expect, it } from 'vitest';
import { LETTERS } from '#lib/music/pitch.ts';
import { buildProfile, isVoiceProfile, pairPrompts } from './calibration';
import { classify, dtwDistance } from './names';
import { analyseFrames, fft, resample } from './signal';
import { findSyllables, voicedRegions } from './syllables';
import { calibrationTake, NAME_VOWELS, RATE, speak } from './testSignals';

describe('signal analysis', () => {
	it('computes a forward and inverse FFT', () => {
		const re = Float64Array.from({ length: 8 }, (_, i) => Math.cos((2 * Math.PI * i) / 8));
		const im = new Float64Array(8);
		fft(re, im);
		expect(re[1]).toBeCloseTo(4);
		expect(re[7]).toBeCloseTo(4);
		expect(re[0]).toBeCloseTo(0);
		fft(re, im, true);
		expect(re[2]).toBeCloseTo(Math.cos(Math.PI / 2));
	});

	it('resamples to the analysis rate', () => {
		const tone = Float32Array.from({ length: 48_000 }, (_, i) =>
			Math.sin((2 * Math.PI * 200 * i) / 48_000)
		);
		const out = resample(tone, 48_000);
		expect(out.length).toBe(16_000);
		expect(Math.max(...out.slice(100, 1000))).toBeCloseTo(1, 1);
	});

	it('tells a voiced vowel from noise and silence', () => {
		const vowel = analyseFrames(speak(0.3, [{ vowel: 'a', at: 0, duration: 0.3 }]));
		const quiet = analyseFrames(speak(0.3, []));
		const middle = Math.floor(vowel.voicing.length / 2);
		expect(vowel.voicing[middle]).toBeGreaterThan(0.8);
		expect(vowel.energyDb[middle]).toBeGreaterThan(quiet.energyDb[middle] + 30);
		expect(vowel.mfcc[middle]).toHaveLength(12);
	});
});

describe('syllables', () => {
	it('times each syllable at its vowel onset', () => {
		const times = [0.3, 0.8, 1.25, 1.9];
		const syllables = findSyllables(
			speak(
				2.4,
				times.map((at, i) => ({ vowel: (['a', 'i', 'o', 'e'] as const)[i], at }))
			),
			RATE
		);
		expect(syllables.map((s) => s.time)).toHaveLength(times.length);
		syllables.forEach((syllable, i) =>
			expect(Math.abs(syllable.time - times[i])).toBeLessThan(0.025)
		);
	});

	it('splits two names said legato at the dip between them', () => {
		const signal = speak(1, [
			{ vowel: 'o', at: 0.2, duration: 0.2 },
			{ vowel: 'e', at: 0.38, duration: 0.2, gain: 0.3 }
		]);
		for (let n = Math.round(0.37 * RATE); n < Math.round(0.39 * RATE); n++) signal[n] *= 0.1;
		const { energyDb, voicing } = analyseFrames(signal);
		expect(voicedRegions(energyDb, voicing)).toHaveLength(2);
	});

	it('ignores a metronome click between two names', () => {
		const signal = speak(1.2, [
			{ vowel: 'a', at: 0.2 },
			{ vowel: 'i', at: 0.8 }
		]);
		const start = Math.round(0.5 * RATE);
		for (let n = 0; n < 0.06 * RATE; n++) {
			signal[start + n] +=
				0.5 * Math.exp(-n / (0.015 * RATE)) * Math.sin((2 * Math.PI * 1568 * n) / RATE);
		}
		expect(findSyllables(signal, RATE)).toHaveLength(2);
	});

	it('finds the same onsets in a 48 kHz recording', () => {
		const syllables = findSyllables(speak(1, [{ vowel: 'a', at: 0.4 }], 48_000), 48_000);
		expect(syllables).toHaveLength(1);
		expect(syllables[0].time).toBeCloseTo(0.4, 1);
	});
});

describe('names', () => {
	it('measures DTW distance, forgiving a stretched syllable', () => {
		const a = [[0], [1], [2], [3]];
		const stretched = [[0], [0], [1], [1], [2], [3]];
		expect(dtwDistance(a, a)).toBe(0);
		expect(dtwDistance(a, stretched)).toBe(0);
		expect(dtwDistance(a, [[5], [5]])).toBeGreaterThan(1);
		expect(dtwDistance(a, [])).toBe(Infinity);
	});
});

describe('calibration', () => {
	const { prompts, syllables } = calibrationTake(0.06);
	const result = buildProfile(prompts, syllables, 'solfege');

	it('pairs every prompt with the syllable said on its click', () => {
		expect(pairPrompts(prompts, syllables)).toHaveLength(prompts.length);
	});

	it('learns each name and the delay from click to vowel', () => {
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		for (const letter of LETTERS) {
			expect(result.profile.templates[letter]).toHaveLength(3);
			expect(Math.abs(result.profile.offsetMs[letter] - 60)).toBeLessThan(25);
		}
		expect(result.profile.rejectDistance).toBeGreaterThan(0);
		expect(isVoiceProfile(JSON.parse(JSON.stringify(result.profile)))).toBe(true);
	});

	it('reports the names it did not hear', () => {
		const withoutE = syllables.filter((_, i) => prompts[i] !== 'E');
		expect(buildProfile(prompts, withoutE, 'letters')).toEqual({ ok: false, missing: ['E'] });
	});

	it('recognises the names in a new take, at another pitch', () => {
		if (!result.ok) throw new Error('calibration failed');
		const take = calibrationTake(0.04, 190);
		const heard = take.syllables.map(
			(syllable) => classify(syllable.features, result.profile)?.letter
		);
		expect(heard).toEqual(take.prompts);
	});

	it('gives a near tie to the name the score expects, and ignores noise', () => {
		if (!result.ok) throw new Error('calibration failed');
		const profile = result.profile;
		const [syllable] = findSyllables(speak(0.6, [{ vowel: NAME_VOWELS.C, at: 0.2 }]), RATE);
		expect(classify(syllable.features, profile)?.letter).toBe('C');
		const tied = { ...profile, templates: { ...profile.templates, G: profile.templates.C } };
		expect(classify(syllable.features, tied)?.letter).toBe('C');
		expect(classify(syllable.features, tied, 'G')?.letter).toBe('G');
		expect(classify(syllable.features, profile, 'G')?.letter).toBe('C');
		expect(classify(syllable.features, { ...profile, rejectDistance: 0 })).toBeNull();
	});
});
