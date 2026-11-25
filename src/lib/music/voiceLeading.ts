import { m } from '#lib/i18n.ts';
import { type ChordRef, chordTone } from './chords';
import { mod, pitchClassOf } from './pitch';
import {
	candidateVoicings,
	LIMITS,
	lowIntervalViolations,
	type Voicing,
	type VoicingType,
	voicingSpec
} from './voicings';

export const MAX_UPPER_MOTION = 2;

export type VoiceLeadingRule = 'voicing' | 'common-tone' | 'step' | 'range';

export interface Violation {
	chordIndex: number;
	rule: VoiceLeadingRule;
	voice?: number;
	message: string;
}

export interface SheetEntry {
	chord: ChordRef;
	type: VoicingType;
}

const sortAscending = (midis: readonly number[]): number[] => [...midis].sort((a, b) => a - b);

export function expectedPitchClasses(chord: ChordRef, type: VoicingType): number[] {
	const spec = voicingSpec(chord.mode, type);
	return [...spec.lh, ...spec.rh].map((token) => pitchClassOf(chordTone(chord, token).name));
}

export function checkVoicing(
	entry: SheetEntry,
	midis: readonly number[],
	chordIndex = 0
): Violation[] {
	const sorted = sortAscending(midis);
	const expected = expectedPitchClasses(entry.chord, entry.type);
	const violations: Violation[] = [];
	const matches =
		sorted.length === expected.length && sorted.every((midi, i) => mod(midi, 12) === expected[i]);
	if (!matches) {
		violations.push({
			chordIndex,
			rule: 'voicing',
			message: m.violation_voicing({ type: entry.type, count: expected.length })
		});
		return violations;
	}
	const lhCount = voicingSpec(entry.chord.mode, entry.type).lh.length;
	const rh = sorted.slice(lhCount);
	const root = sorted[0];
	if (rh.some((midi) => midi > LIMITS.rhTop)) {
		violations.push({ chordIndex, rule: 'range', message: m.violation_rh_high() });
	}
	if (rh.some((midi) => midi < LIMITS.rhBottom)) {
		violations.push({ chordIndex, rule: 'range', message: m.violation_rh_low() });
	}
	if (root < LIMITS.lowestRoot) {
		violations.push({ chordIndex, rule: 'range', message: m.violation_root_low() });
	}
	for (const index of lowIntervalViolations(sorted)) {
		violations.push({
			chordIndex,
			rule: 'range',
			voice: index,
			message: m.violation_low_interval()
		});
	}
	return violations;
}

export function checkMotion(
	previous: readonly number[],
	next: readonly number[],
	chordIndex: number
): Violation[] {
	const before = sortAscending(previous);
	const after = sortAscending(next);
	const violations: Violation[] = [];
	if (before.length !== after.length) return violations;
	const nextPitchClasses = new Set(after.map((midi) => mod(midi, 12)));
	const afterSet = new Set(after);
	for (let voice = 1; voice < before.length; voice++) {
		const from = before[voice];
		const to = after[voice];
		if (nextPitchClasses.has(mod(from, 12)) && !afterSet.has(from)) {
			violations.push({
				chordIndex,
				rule: 'common-tone',
				voice,
				message: m.violation_common_tone({ voice: voice + 1 })
			});
		} else if (Math.abs(to - from) > MAX_UPPER_MOTION) {
			violations.push({
				chordIndex,
				rule: 'step',
				voice,
				message: m.violation_leap({ voice: voice + 1, semitones: Math.abs(to - from) })
			});
		}
	}
	return violations;
}

export function checkSheet(
	entries: readonly SheetEntry[],
	answers: readonly (readonly number[])[]
): Violation[] {
	return entries.flatMap((entry, index) => {
		const own = checkVoicing(entry, answers[index] ?? [], index);
		const previous = answers[index - 1];
		if (index === 0 || !previous || own.some((v) => v.rule === 'voicing')) return own;
		return [...own, ...checkMotion(previous, answers[index] ?? [], index)];
	});
}

const motionCost = (previous: readonly number[], next: readonly number[]): number =>
	previous.reduce((sum, midi, i) => sum + (i === 0 ? 0 : Math.abs(next[i] - midi)), 0);

export function alternatingTypes(length: number, start: VoicingType): VoicingType[] {
	return Array.from({ length }, (_, i) => (i % 2 === 0 ? start : start === 'A' ? 'B' : 'A'));
}

export function solveSheet(entries: readonly SheetEntry[]): Voicing[] | null {
	const layers = entries.map((entry) => candidateVoicings(entry.chord, entry.type));
	if (layers.some((layer) => layer.length === 0)) return null;

	type Node = { cost: number; previous: number };
	const table: Node[][] = layers.map((layer) =>
		layer.map(() => ({ cost: Infinity, previous: -1 }))
	);
	const first = table[0];
	first.forEach((node) => (node.cost = 0));

	for (let i = 1; i < layers.length; i++) {
		const current = layers[i];
		const before = layers[i - 1];
		current.forEach((candidate, c) => {
			before.forEach((prior, p) => {
				const priorNode = table[i - 1][p];
				if (priorNode.cost === Infinity) return;
				if (checkMotion(prior.midis, candidate.midis, i).length > 0) return;
				const cost = priorNode.cost + motionCost(prior.midis, candidate.midis);
				const node = table[i][c];
				if (cost < node.cost) {
					node.cost = cost;
					node.previous = p;
				}
			});
		});
	}

	const last = table.at(-1) as Node[];
	let bestIndex = -1;
	last.forEach((node, index) => {
		const best = last[bestIndex];
		if (node.cost < Infinity && (!best || node.cost < best.cost)) bestIndex = index;
	});
	if (bestIndex < 0) return null;

	const path: Voicing[] = [];
	for (let i = layers.length - 1; i >= 0; i--) {
		path.unshift(layers[i][bestIndex]);
		bestIndex = table[i][bestIndex].previous;
	}
	return path;
}

export function solveWithAlternation(
	chords: readonly ChordRef[]
): { entries: SheetEntry[]; voicings: Voicing[] } | null {
	for (const start of ['A', 'B'] as const) {
		const types = alternatingTypes(chords.length, start);
		const entries = chords.map((chord, i) => ({ chord, type: types[i] }));
		const voicings = solveSheet(entries);
		if (voicings) return { entries, voicings };
	}
	return null;
}
