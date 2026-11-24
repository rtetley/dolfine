import { describe, expect, it } from 'vitest';
import { fromMidi, noteName, parsePitch, placeAbove, toMidi, transpose, vexKey } from './pitch';
import { createRng } from './random';

describe('pitch', () => {
	it('converts to midi', () => {
		expect(toMidi(parsePitch('C4'))).toBe(60);
		expect(toMidi(parsePitch('A0'))).toBe(21);
		expect(toMidi(parsePitch('Cb4'))).toBe(59);
		expect(toMidi(parsePitch('B#3'))).toBe(60);
	});

	it('transposes keeping letter spelling', () => {
		expect(transpose(parsePitch('B3'), { steps: 2, semitones: 4 })).toEqual(parsePitch('D#4'));
		expect(transpose(parsePitch('D4'), { steps: -1, semitones: -2 })).toEqual(parsePitch('C4'));
		expect(transpose(parsePitch('B3'), { steps: 6, semitones: 9 })).toEqual(parsePitch('Ab4'));
	});

	it('places a pitch class strictly above a floor', () => {
		expect(toMidi(placeAbove({ letter: 'C', accidental: 0 }, 59))).toBe(60);
		expect(toMidi(placeAbove({ letter: 'C', accidental: 0 }, 60))).toBe(72);
	});

	it('spells from midi with sharps or flats', () => {
		expect(fromMidi(61)).toEqual(parsePitch('C#4'));
		expect(fromMidi(61, true)).toEqual(parsePitch('Db4'));
		expect(fromMidi(59)).toEqual(parsePitch('B3'));
	});

	it('names notes in letters and solfege', () => {
		expect(noteName({ letter: 'F', accidental: 1 })).toBe('F♯');
		expect(noteName({ letter: 'B', accidental: -1 }, 'solfege')).toBe('Si♭');
		expect(vexKey(parsePitch('Eb5'))).toBe('eb/5');
	});
});

describe('random', () => {
	it('is deterministic for a seed', () => {
		const a = createRng(42);
		const b = createRng(42);
		expect([a.next(), a.int(1, 6), a.pick(['x', 'y', 'z'])]).toEqual([
			b.next(),
			b.int(1, 6),
			b.pick(['x', 'y', 'z'])
		]);
	});

	it('keeps ints within bounds', () => {
		const rng = createRng(7);
		const values = Array.from({ length: 500 }, () => rng.int(3, 5));
		expect(Math.min(...values)).toBe(3);
		expect(Math.max(...values)).toBe(5);
	});
});
