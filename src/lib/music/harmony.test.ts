import { describe, expect, it } from 'vitest';
import { chordSymbol, chordTone, formatSuffix, toneLabel } from './chords';
import { noteName } from './pitch';
import { degreeRoot, MODES, modeScale, parentRootOf } from './scales';

const C = { letter: 'C', accidental: 0 } as const;

describe('modes', () => {
	it('defines 21 modes', () => {
		expect(MODES).toHaveLength(21);
	});

	it('spells the altered scale from B', () => {
		const names = modeScale('melodicMinor:7', { letter: 'B', accidental: 0, octave: 3 }).map((p) =>
			noteName(p)
		);
		expect(names).toEqual(['B', 'C', 'D', 'E♭', 'F', 'G', 'A']);
	});

	it('finds the chord on each degree of C, matching the PRD table', () => {
		const symbols = MODES.map((mode) =>
			chordSymbol({ root: degreeRoot(mode.parent, mode.degree, C), mode: mode.id })
		);
		expect(symbols).toEqual([
			'CΔ7',
			'D-7',
			'E-7',
			'FΔ7(♯11)',
			'G7',
			'A-7',
			'Bø7',
			'C-Δ7',
			'D7sus4(♭9)',
			'E♭Δ7(♯5)',
			'F7(♯11)',
			'G7(♭13)',
			'Aø7',
			'B7alt',
			'C-Δ7',
			'Dø7',
			'E♭Δ7(♯5)',
			'F-7(♯11)',
			'G7(♭9 ♭13)',
			'A♭Δ7(♯9)',
			'B°7'
		]);
	});

	it('recovers the parent root of a mode', () => {
		expect(parentRootOf('melodicMinor:7', { letter: 'B', accidental: 0 })).toEqual(C);
		expect(parentRootOf('major:2', { letter: 'D', accidental: 0 })).toEqual(C);
	});
});

describe('chord tones', () => {
	it('labels altered tones', () => {
		expect(toneLabel('melodicMinor:7', 13)).toBe('♭13');
		expect(toneLabel('melodicMinor:7', 'sharp9')).toBe('♯9');
		expect(toneLabel('major:7', 5)).toBe('♭5');
		expect(toneLabel('harmonicMinor:7', 7)).toBe('𝄫7');
	});

	it('spells the altered ♯9 as a natural D over B', () => {
		const tone = chordTone(
			{ root: { letter: 'B', accidental: 0 }, mode: 'melodicMinor:7' },
			'sharp9'
		);
		expect(noteName(tone.name)).toBe('D');
	});

	it('formats classic chord symbols', () => {
		expect(formatSuffix('Δ7(♯11)', 'classic')).toBe('maj7(♯11)');
		expect(formatSuffix('-7', 'classic')).toBe('m7');
		expect(formatSuffix('ø7', 'classic')).toBe('m7♭5');
		expect(formatSuffix('-Δ7', 'classic')).toBe('m(maj7)');
		expect(formatSuffix('-Δ9', 'classic')).toBe('m(maj9)');
		expect(formatSuffix('Δ9(♯11)', 'classic')).toBe('maj9(♯11)');
		expect(formatSuffix('ø9', 'classic')).toBe('m9♭5');
		expect(formatSuffix('°7(♭13)', 'classic')).toBe('dim7(♭13)');
		expect(formatSuffix('-6/9', 'classic')).toBe('m6/9');
	});
});
