import { m } from '#lib/i18n.ts';
import type { ChordRef } from '#lib/music/chords.ts';
import { spellMidi } from '#lib/music/pitch.ts';
import { LIMITS, lowIntervalViolations } from '#lib/music/voicings.ts';
import type { NoteStyle, Score, ScoreNote } from '#lib/notation/model.ts';
import { type SheetColumn, spellChord } from './display';
import type { ModeQuestion, NoteCheck } from './questions';

const ascending = (midis: Iterable<number>): number[] => [...new Set(midis)].sort((a, b) => a - b);

const REST: ScoreNote = { id: 'rest', ticks: 48, rest: true, pitches: [] };

/** The notes written so far, in scale order and spelled with the scale's own letters. */
export function writtenScaleScore(
	question: ModeQuestion,
	midis: Iterable<number>,
	checks?: readonly NoteCheck[]
): Score {
	const outcome = new Map(checks?.map((check) => [check.midi, check.ok]));
	const notes = ascending(midis).map((midi, i): ScoreNote => ({
		id: `w${i}`,
		ticks: 12,
		rest: false,
		pitches: [spellMidi(midi, question.notes)],
		style: outcome.has(midi) ? (outcome.get(midi) ? 'correct' : 'wrong') : undefined
	}));
	return { parts: [{ clef: 'treble', measures: [notes.length > 0 ? notes : [REST]] }] };
}

export interface RuleIssues {
	flagged: Set<number>;
	messages: string[];
}

/**
 * Composition rules that apply while a chord is still being written. With a hand split
 * (lhCount) the range rules apply too; without one only the low interval limits do.
 */
export function voicingRuleIssues(midis: Iterable<number>, lhCount?: number): RuleIssues {
	const sorted = ascending(midis);
	const flagged = new Set<number>();
	const messages: string[] = [];
	const flag = (notes: readonly number[], message: string): void => {
		if (notes.length === 0) return;
		notes.forEach((note) => flagged.add(note));
		messages.push(message);
	};
	if (lhCount !== undefined && sorted.length > lhCount) {
		const rh = sorted.slice(lhCount);
		flag(
			rh.filter((midi) => midi > LIMITS.rhTop),
			m.violation_rh_high()
		);
		flag(
			rh.filter((midi) => midi < LIMITS.rhBottom),
			m.violation_rh_low()
		);
	}
	if (lhCount !== undefined && sorted[0] !== undefined && sorted[0] < LIMITS.lowestRoot) {
		flag([sorted[0]], m.violation_root_low());
	}
	const lowPairs = lowIntervalViolations(sorted).flatMap((i) => [sorted[i], sorted[i + 1]]);
	flag(
		lowPairs.filter((midi): midi is number => midi !== undefined),
		m.violation_low_interval()
	);
	return { flagged, messages };
}

/** A grand-staff column for a chord being written, with rule problems marked in red. */
export function writtenChordColumn(
	id: string,
	chord: ChordRef,
	midis: Iterable<number>,
	options: { label?: string; lhCount?: number; flagged?: ReadonlySet<number> } = {}
): SheetColumn {
	const sorted = ascending(midis);
	const styles = sorted.map((midi): NoteStyle | undefined =>
		options.flagged?.has(midi) ? 'wrong' : undefined
	);
	return {
		id,
		label: options.label ?? '',
		pitches: spellChord(chord, sorted),
		lhCount: options.lhCount,
		pitchStyles: styles.some(Boolean) ? styles : undefined
	};
}
