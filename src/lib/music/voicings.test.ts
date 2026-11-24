import { describe, expect, it } from 'vitest';
import type { ChordRef } from './chords';
import { noteName, pitchLabel } from './pitch';
import { checkMotion, checkSheet, solveSheet, solveWithAlternation } from './voiceLeading';
import {
	candidateVoicings,
	lowIntervalViolations,
	rangeProblems,
	realizeVoicing
} from './voicings';

const names = (chord: ChordRef, type: 'A' | 'B') => {
	const voicing = realizeVoicing(chord, type, 47);
	return `${voicing.lh.map((p) => noteName(p)).join(' ')} / ${voicing.rh.map((p) => noteName(p)).join(' ')}`;
};

const B = { letter: 'B', accidental: 0 } as const;
const E = { letter: 'E', accidental: 0 } as const;

describe('alternative voicings from the PRD', () => {
	it('voices Phrygian as 7sus4(♭9)', () => {
		expect(names({ root: E, mode: 'major:3' }, 'A')).toBe('E D / A B F');
		expect(names({ root: E, mode: 'major:3' }, 'B')).toBe('E A D / F B');
	});

	it('voices Locrian with the 11th', () => {
		expect(names({ root: B, mode: 'major:7' }, 'A')).toBe('B A / D F E');
		expect(names({ root: B, mode: 'major:7' }, 'B')).toBe('B D A / F E');
	});

	it('voices Altered with ♭13 and ♯9', () => {
		expect(names({ root: B, mode: 'melodicMinor:7' }, 'A')).toBe('B A / D♯ G D');
		expect(names({ root: B, mode: 'melodicMinor:7' }, 'B')).toBe('B D♯ A / D G');
	});

	it('voices Ultralocrian without tensions', () => {
		expect(names({ root: B, mode: 'harmonicMinor:7' }, 'A')).toBe('B A♭ / D F B');
		expect(names({ root: B, mode: 'harmonicMinor:7' }, 'B')).toBe('B D A♭ / B F');
	});
});

describe('ranges', () => {
	it('flags intervals under the low interval limit', () => {
		expect(lowIntervalViolations([45, 48])).toEqual([0]);
		expect(lowIntervalViolations([48, 51])).toEqual([]);
	});

	it('only offers candidates within the hand limits', () => {
		const candidates = candidateVoicings(
			{ root: { letter: 'D', accidental: 0 }, mode: 'major:2' },
			'A'
		);
		expect(candidates.length).toBeGreaterThan(0);
		candidates.forEach((voicing) => expect(rangeProblems(voicing)).toEqual([]));
	});
});

const iiVI: ChordRef[] = [
	{ root: { letter: 'D', accidental: 0 }, mode: 'major:2' },
	{ root: { letter: 'G', accidental: 0 }, mode: 'major:5' },
	{ root: { letter: 'C', accidental: 0 }, mode: 'major:1' }
];

describe('voice leading', () => {
	it('solves a major II–V–I with alternating voicings', () => {
		const solved = solveWithAlternation(iiVI);
		expect(solved).not.toBeNull();
		const answers = solved?.voicings.map((v) => v.midis) ?? [];
		expect(checkSheet(solved?.entries ?? [], answers)).toEqual([]);
		expect(solved?.voicings.map((v) => v.notes.map((p) => pitchLabel(p)).join(' '))).toEqual([
			'D3 C4 F4 A4 E5',
			'G3 B3 F4 A4 D5',
			'C3 B3 E4 G4 D5'
		]);
	});

	it('rejects upper-voice leaps', () => {
		const violations = checkMotion([50, 60, 65, 69, 76], [43, 59, 65, 69, 70], 1);
		expect(violations.map((v) => v.rule)).toEqual(['step']);
	});

	it('flags a common tone that moves', () => {
		const violations = checkMotion([50, 60, 65, 69, 76], [55, 59, 64, 69, 74], 1);
		expect(violations.some((v) => v.rule === 'common-tone')).toBe(true);
	});

	it('rejects a voicing in the wrong order', () => {
		const entries = [{ chord: iiVI[0], type: 'A' as const }];
		expect(checkSheet(entries, [[50, 53, 60, 69, 76]])[0]?.rule).toBe('voicing');
	});

	it('solves a single chord sheet', () => {
		expect(solveSheet([{ chord: iiVI[0], type: 'B' }])).toHaveLength(1);
	});
});
