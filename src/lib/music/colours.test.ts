import { describe, expect, it } from 'vitest';
import { LEVELS } from './levels';
import {
	CHORD_COLOURS,
	colourMidis,
	colourScale,
	COLOUR_SETS,
	COLOURS,
	coloursIn,
	colourVoicing,
	tokenInterval
} from './colours';
import { ALL_ROOTS, type Pitch, toMidi } from './pitch';

const C = { letter: 'C', accidental: 0 } as const;
const names = (pitches: readonly Pitch[]) =>
	pitches.map(
		(p) =>
			`${p.letter}${p.accidental === -1 ? 'b' : p.accidental === 1 ? '#' : p.accidental === -2 ? 'bb' : ''}`
	);

describe('chord colours', () => {
	it('reads degree tokens as intervals', () => {
		expect(tokenInterval('♭3')).toEqual({ steps: 2, semitones: 3 });
		expect(tokenInterval('♯11')).toEqual({ steps: 10, semitones: 18 });
		expect(tokenInterval('𝄫7')).toEqual({ steps: 6, semitones: 9 });
		expect(tokenInterval('♭13')).toEqual({ steps: 12, semitones: 20 });
	});

	it('voices Cmaj9 as type A (1 7 / 3 5 9) and type B (1 3 7 / 9 5)', () => {
		const a = colourVoicing('maj9', C, 'A');
		expect(names(a.lh)).toEqual(['C', 'B']);
		expect(names(a.rh)).toEqual(['E', 'G', 'D']);
		const b = colourVoicing('maj9', C, 'B');
		expect(names(b.lh)).toEqual(['C', 'E', 'B']);
		expect(names(b.rh)).toEqual(['D', 'G']);
	});

	it('swaps in the colour’s own tone, and doubles the third or seventh where there is no ninth', () => {
		expect(names(colourVoicing('69', C, 'A').lh)).toEqual(['C', 'A']);
		expect(names(colourVoicing('9sus4', C, 'A').rh)).toEqual(['F', 'G', 'D']);
		expect(names(colourVoicing('m7b5', C, 'A').rh)).toEqual(['Eb', 'Gb', 'Bb']);
		expect(names(colourVoicing('m7b5', C, 'B').rh)).toEqual(['Eb', 'Gb']);
		expect(names(colourVoicing('dim', C, 'A').lh)).toEqual(['C', 'Bbb']);
		expect(names(colourVoicing('maj9#11', C, 'B').rh)).toEqual(['D', 'F#']);
		expect(names(colourVoicing('7#9', C, 'A').rh)).toEqual(['E', 'G', 'D#']);
	});

	it('voices every colour in every key low to high, left hand in the bass, right hand above', () => {
		for (const id of COLOURS) {
			for (const root of ALL_ROOTS) {
				for (const type of ['A', 'B'] as const) {
					const midis = colourMidis(id, root, type);
					expect(midis).toEqual([...midis].sort((x, y) => x - y));
					expect(new Set(midis).size).toBe(midis.length);
					expect(midis[0]).toBeGreaterThanOrEqual(43);
					expect(midis.at(-1)).toBeLessThanOrEqual(84);
					expect(midis).toHaveLength(5);
				}
			}
		}
	});

	it('spells each colour’s scale from its root', () => {
		expect(names(colourScale('9#5', C))).toEqual(['C', 'D', 'E', 'F#', 'G#', 'Bb']);
		expect(names(colourScale('dim', C))).toEqual(['C', 'D', 'Eb', 'F', 'Gb', 'Ab', 'A', 'B']);
		const scale = colourScale('m11', { letter: 'G', accidental: 0 }).map(toMidi);
		expect(scale).toEqual([...scale].sort((x, y) => x - y));
	});

	it('pairs every colour with a similar one, twelve then four', () => {
		expect(coloursIn('twelve')).toHaveLength(12);
		expect(coloursIn('four')).toEqual(['m11', '7b9sus4', 'maj9#11', 'm7b6']);
		for (const id of COLOURS) expect(CHORD_COLOURS[CHORD_COLOURS[id].similar]).toBeDefined();
	});

	it('introduces the colours a few at a time, ending with all sixteen', () => {
		expect(COLOUR_SETS[1]).toEqual(['maj9', '69']);
		expect(COLOUR_SETS[3]).toEqual(expect.arrayContaining([...COLOUR_SETS[1], ...COLOUR_SETS[2]]));
		const heardBy8 = new Set(
			LEVELS.filter((level) => level <= 8).flatMap((level) => COLOUR_SETS[level])
		);
		expect([...heardBy8].sort()).toEqual(coloursIn('twelve').sort());
		expect(COLOUR_SETS[10]).toHaveLength(16);
		for (const level of LEVELS) expect(COLOUR_SETS[level].length).toBeGreaterThanOrEqual(2);
	});
});
