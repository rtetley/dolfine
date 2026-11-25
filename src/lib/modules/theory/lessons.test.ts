import { describe, expect, it } from 'vitest';
import { chordSymbol, chordTone, seventhChordTones } from '#lib/music/chords.ts';
import { ALL_ROOTS, noteName, pitchClassOf, toMidi } from '#lib/music/pitch.ts';
import { MODES, modeInfo, PARENT_SCALES } from '#lib/music/scales.ts';
import { defaultVoicing } from '#lib/music/voicings.ts';
import {
	CHARACTERISTIC_NOTES,
	harmonise,
	isLessonId,
	lessonVoicings,
	parseRootCode,
	rootCode,
	rootlessTokens,
	TYPICAL_CHORDS,
	VOICING_KINDS,
	voicingFormula
} from './lessons';

const C = { letter: 'C', accidental: 0 } as const;
const pcs = (pitches: { letter: string; accidental: number }[]) =>
	new Set(pitches.map((p) => pitchClassOf(p as Parameters<typeof pitchClassOf>[0])));
const ascending = (midis: number[]) => midis.every((m, i) => i === 0 || m > midis[i - 1]);

describe('mode tables', () => {
	it.each(MODES.map((mode) => mode.id))('%s lists its seventh chord first', (id) => {
		expect(TYPICAL_CHORDS[id][0]).toBe(modeInfo(id).chordSuffix);
		expect(CHARACTERISTIC_NOTES[id].length).toBeGreaterThan(0);
	});
});

describe('harmonise', () => {
	it('builds the seven chords of C major', () => {
		const symbols = harmonise('major', C).map((study) => chordSymbol(study.chord));
		expect(symbols).toEqual(['CΔ7', 'D-7', 'E-7', 'FΔ7(♯11)', 'G7', 'A-7', 'Bø7']);
	});

	it.each(PARENT_SCALES)('gives every %s degree a scale and a close seventh chord', (parent) => {
		for (const root of ALL_ROOTS) {
			for (const study of harmonise(parent, root)) {
				expect(study.scale).toHaveLength(7);
				expect(noteName(study.scale[0])).toBe(noteName(study.chord.root));
				const midis = study.seventh.map(toMidi);
				expect(ascending(midis)).toBe(true);
				expect(midis.at(-1)! - midis[0]).toBeLessThan(12);
				expect(pcs(study.seventh)).toEqual(pcs(seventhChordTones(study.chord).map((t) => t.name)));
			}
		}
	});
});

describe('lessonVoicings', () => {
	const chords = PARENT_SCALES.flatMap((parent) =>
		ALL_ROOTS.flatMap((root) => harmonise(parent, root).map((study) => study.chord))
	);

	it('offers every voicing kind in order', () => {
		expect(lessonVoicings({ root: C, mode: 'major:2' }).map((v) => v.kind)).toEqual([
			...VOICING_KINDS
		]);
	});

	it('voices every chord of every scale cleanly', () => {
		for (const chord of chords) {
			const seventh = pcs(seventhChordTones(chord).map((t) => t.name));
			const rootPc = pitchClassOf(chord.root);
			for (const voicing of lessonVoicings(chord)) {
				const midis = voicing.pitches.map(toMidi);
				expect(ascending(midis), `${chordSymbol(chord)} ${voicing.kind}`).toBe(true);
				expect(voicing.pitches).toHaveLength(voicing.tokens.length);
				voicing.pitches.forEach((pitch, i) => {
					expect(pitchClassOf(pitch)).toBe(pitchClassOf(chordTone(chord, voicing.tokens[i]).name));
				});
				if (voicing.kind === 'close' || voicing.kind === 'drop2') {
					expect(pcs(voicing.pitches)).toEqual(seventh);
				}
				if (voicing.kind.startsWith('shell')) expect(midis[0] % 12).toBe(rootPc);
				if (voicing.kind.startsWith('rootless') && chord.mode !== 'harmonicMinor:7') {
					expect(midis.map((m) => m % 12)).not.toContain(rootPc);
				}
			}
		}
	});

	it('spreads drop 2 wider than close position', () => {
		const [close, drop2] = lessonVoicings({ root: C, mode: 'major:1' });
		const span = (pitches: typeof close.pitches) => toMidi(pitches.at(-1)!) - toMidi(pitches[0]);
		expect(span(drop2.pitches)).toBeGreaterThan(span(close.pitches));
		expect(drop2.pitches.map((p) => noteName(p))).toEqual(['G', 'C', 'E', 'B']);
	});

	it('reuses the exercises’ two-hand voicings', () => {
		const chord = { root: { letter: 'G', accidental: 0 }, mode: 'melodicMinor:7' } as const;
		const typeB = lessonVoicings(chord).find((v) => v.kind === 'type-b');
		expect(typeB?.pitches.map(toMidi)).toEqual(defaultVoicing(chord, 'B').midis);
		expect(typeB?.alternative).toBe(true);
	});

	it('takes each mode’s tensions for rootless voicings', () => {
		expect(rootlessTokens('major:2', 'a')).toEqual([3, 5, 7, 9]);
		expect(rootlessTokens('major:2', 'b')).toEqual([7, 9, 3, 5]);
		expect(rootlessTokens('melodicMinor:7', 'a')).toEqual([3, 13, 7, 'sharp9']);
		expect(rootlessTokens('major:3', 'a')).toEqual([4, 5, 7, 9]);
	});

	it('writes formulas with each hand separated', () => {
		const voicings = lessonVoicings({ root: C, mode: 'major:5' });
		const formula = (kind: string) =>
			voicingFormula(
				'major:5',
				voicings.find((v) => v.kind === kind)!
			);
		expect(formula('close')).toBe('1 3 5 ♭7');
		expect(formula('type-a')).toBe('1 ♭7 / 3 5 9');
		expect(formula('rootless-b')).toBe('♭7 9 3 5');
	});
});

describe('lesson ids and roots', () => {
	it('recognises lesson ids', () => {
		expect(isLessonId('voicings')).toBe(true);
		expect(isLessonId('blues')).toBe(false);
	});

	it.each(ALL_ROOTS)('round-trips %o through a URL code', (root) => {
		expect(parseRootCode(rootCode(root))).toEqual(root);
	});

	it.each([null, '', 'H', 'Cb', 'c'])('rejects %o', (code) => {
		expect(parseRootCode(code)).toBeNull();
	});
});
