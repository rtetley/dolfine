import { describe, expect, it } from 'vitest';
import { noteName, parsePitch, toMidi } from '#lib/music/pitch.ts';
import { closeChord, grandStaff, scaleScore, spellChord } from './display';

const G7 = { root: { letter: 'G', accidental: 0 }, mode: 'major:5' } as const;
const Bb_MAJ7 = { root: { letter: 'B', accidental: -1 }, mode: 'major:1' } as const;

describe('scaleScore', () => {
	it('writes the notes as quarters in one treble bar', () => {
		const score = scaleScore(['C4', 'D4', 'E4'].map(parsePitch), 'q');
		const bar = score.parts[0].measures[0];
		expect(score.parts[0].clef).toBe('treble');
		expect(bar.map((n) => n.id)).toEqual(['q0', 'q1', 'q2']);
		expect(bar.every((n) => n.ticks === 12 && !n.rest)).toBe(true);
	});
});

describe('spellChord', () => {
	it('sorts and spells with the chord’s own letters', () => {
		const names = spellChord(Bb_MAJ7, [69, 58, 62, 65]).map((p) => noteName(p));
		expect(names).toEqual(['B♭', 'D', 'F', 'A']);
	});
});

describe('closeChord', () => {
	it('stacks the seventh chord upward from the floor', () => {
		const midis = closeChord(G7).map(toMidi);
		expect(midis).toEqual([55, 59, 62, 65]);
	});

	it('respects a custom floor', () => {
		expect(toMidi(closeChord(G7, 60)[0])).toBe(67);
	});
});

describe('grandStaff', () => {
	it('splits hands at middle C by default', () => {
		const score = grandStaff([
			{ id: 'c1', label: 'G7', pitches: ['G2', 'F3', 'B3', 'E4'].map(parsePitch) }
		]);
		const [treble, bass] = score.parts;
		expect(treble.measures[0][0].pitches.map(toMidi)).toEqual([64]);
		expect(bass.measures[0][0].pitches.map(toMidi)).toEqual([43, 53, 59]);
		expect(treble.measures[0][0].above).toBe('G7');
	});

	it('honours an explicit left-hand count and rests empty hands', () => {
		const score = grandStaff([
			{ id: 'c1', label: '', lhCount: 0, pitches: ['C4', 'E4'].map(parsePitch) }
		]);
		expect(score.parts[1].measures[0][0].rest).toBe(true);
		expect(score.parts[0].measures[0][0].pitches).toHaveLength(2);
		expect(score.parts[0].measures[0][0].above).toBeUndefined();
	});
});
