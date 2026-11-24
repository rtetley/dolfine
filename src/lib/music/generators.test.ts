import { describe, expect, it } from 'vitest';
import { generateMelody, keyAccidentals, staffRange, tonicName } from './melody';
import { polyrhythm } from './polyrhythm';
import { buildProgression } from './progressions';
import { createRng } from './random';
import {
	assignSyllables,
	generateRhythm,
	measureTicks,
	type RhythmFeature,
	swungSeconds,
	totalTicks
} from './rhythm';
import { scorePerformance } from './scoring';
import { chordSymbol } from './chords';
import { toMidi } from './pitch';

const ALL: ReadonlySet<RhythmFeature> = new Set([
	'quarters',
	'eighths',
	'halves',
	'rests',
	'sixteenths',
	'dotted',
	'triplets',
	'syncopation',
	'ties'
]);

describe('rhythm', () => {
	it.each([
		{ beats: 4, unit: 4 },
		{ beats: 3, unit: 4 },
		{ beats: 6, unit: 8 },
		{ beats: 12, unit: 8 },
		{ beats: 5, unit: 8 },
		{ beats: 7, unit: 8 }
	] as const)('fills every bar of $beats/$unit exactly', (meter) => {
		for (let seed = 0; seed < 30; seed++) {
			const measures = generateRhythm(meter, 8, ALL, createRng(seed));
			measures.forEach((events) => expect(totalTicks(events)).toBe(measureTicks(meter)));
		}
	});

	it('keeps triplets in groups of three', () => {
		const measures = generateRhythm(
			{ beats: 4, unit: 4 },
			16,
			new Set(['quarters', 'triplets']),
			createRng(3)
		);
		measures.forEach((events) => {
			const triplets = events.filter((e) => e.triplet).length;
			expect(triplets % 3).toBe(0);
		});
	});

	it('swings off-beat eighths', () => {
		expect(swungSeconds(6, 60, 2)).toBeCloseTo(2 / 3);
		expect(swungSeconds(6, 60, 1)).toBeCloseTo(0.5);
		expect(swungSeconds(12, 60, 2)).toBeCloseTo(1);
	});

	it('assigns a syllable to every note', () => {
		const measures = assignSyllables(generateRhythm({ beats: 4, unit: 4 }, 4, ALL, createRng(5)), {
			beats: 4,
			unit: 4
		});
		measures
			.flat()
			.forEach((event) =>
				expect(event.rest ? event.syllable : typeof event.syllable).toBe(
					event.rest ? undefined : 'string'
				)
			);
	});
});

describe('melody', () => {
	it('stays in range and ends on the tonic', () => {
		const settings = {
			key: { fifths: -3, mode: 'major' as const },
			meter: { beats: 4, unit: 4 as const },
			bars: 8,
			clef: 'treble' as const,
			range: 'staff' as const,
			features: new Set<RhythmFeature>(['quarters', 'eighths', 'halves']),
			maxLeap: 3,
			accidentalRate: 0
		};
		const [low, high] = staffRange('treble', 'staff');
		for (let seed = 0; seed < 20; seed++) {
			const melody = generateMelody(settings, createRng(seed));
			const notes = melody.flat().filter((n) => n.pitch);
			notes.forEach((n) => {
				const midi = toMidi(n.pitch!);
				expect(midi).toBeGreaterThanOrEqual(low - 1);
				expect(midi).toBeLessThanOrEqual(high + 1);
			});
			expect(notes.at(-1)?.pitch?.letter).toBe(tonicName(settings.key).letter);
		}
	});

	it('knows key signatures', () => {
		expect([...keyAccidentals(-3).keys()]).toEqual(['B', 'E', 'A']);
		expect(tonicName({ fifths: 2, mode: 'minor' })).toEqual({ letter: 'B', accidental: 0 });
	});
});

describe('progressions', () => {
	it('builds a minor II–V–I', () => {
		const progression = buildProgression(
			'ii-v-i-minor',
			{ letter: 'C', accidental: 0 },
			createRng(1)
		);
		expect(progression.chords.map((c) => chordSymbol(c))).toEqual(['Dø7', 'G7(♭9 ♭13)', 'C-Δ7']);
	});

	it('builds a blues in F', () => {
		const progression = buildProgression('blues', { letter: 'F', accidental: 0 }, createRng(1));
		expect(progression.chords.slice(0, 2).map((c) => chordSymbol(c))).toEqual(['F7', 'B♭7']);
	});

	it('roots modal vamps on the key', () => {
		for (let seed = 0; seed < 10; seed++) {
			const vamp = buildProgression('modal-vamp', { letter: 'A', accidental: 0 }, createRng(seed));
			expect(vamp.chords[0]?.root).toEqual({ letter: 'A', accidental: 0 });
		}
	});
});

describe('polyrhythm', () => {
	it('builds a 3:2 composite', () => {
		const cycle = polyrhythm(3, 2);
		expect(cycle.length).toBe(6);
		expect(cycle.composite.map((c) => c.position)).toEqual([0, 2, 3, 4]);
	});
});

describe('scoring', () => {
	it('classifies correct, late, wrong and missed notes', () => {
		const expected = [
			{ id: 'a', midi: 60, time: 0 },
			{ id: 'b', midi: 62, time: 500 },
			{ id: 'c', midi: 64, time: 1000 },
			{ id: 'd', midi: 65, time: 1500 }
		];
		const played = [
			{ midi: 60, time: 20 },
			{ midi: 62, time: 700 },
			{ midi: 63, time: 1010 }
		];
		const summary = scorePerformance(expected, played, 100);
		expect(summary.notes.map((n) => n.outcome)).toEqual(['correct', 'late', 'wrong', 'missed']);
		expect(summary.pitchAccuracy).toBe(50);
		expect(summary.rhythmAccuracy).toBe(25);
	});
});
