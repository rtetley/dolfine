import { m } from '#lib/i18n.ts';

export interface ExpectedNote {
	id: string;
	midi: number;
	time: number;
}

export interface PlayedNote {
	midi: number;
	time: number;
}

export interface Timed {
	time: number;
}

export type NoteOutcome = 'correct' | 'early' | 'late' | 'wrong' | 'missed';

export interface ScoredNote {
	id: string;
	outcome: NoteOutcome;
	deltaMs?: number;
}

export interface ScoreSummary<P extends Timed = PlayedNote> {
	notes: ScoredNote[];
	extras: P[];
	pitchAccuracy: number;
	rhythmAccuracy: number;
}

export const scorePerformance = (
	expected: readonly ExpectedNote[],
	played: readonly PlayedNote[],
	toleranceMs: number
): ScoreSummary =>
	scoreTimed(expected, played, toleranceMs, (target, note) => note.midi === target.midi);

/**
 * Matches each expected note with the nearest event that `same` accepts. The comparison is a
 * parameter so a MIDI keyboard is checked on exact pitch and spoken reading on the note name.
 */
export function scoreTimed<E extends ExpectedNote, P extends Timed>(
	expected: readonly E[],
	played: readonly P[],
	toleranceMs: number,
	same: (target: E, note: P) => boolean
): ScoreSummary<P> {
	const searchWindow = Math.max(toleranceMs * 3, 250);
	const used = new Set<number>();

	const nearest = (target: E, predicate: (note: P) => boolean): number => {
		let best = -1;
		let bestDistance = Infinity;
		played.forEach((note, index) => {
			if (used.has(index) || !predicate(note)) return;
			const distance = Math.abs(note.time - target.time);
			if (distance <= searchWindow && distance < bestDistance) {
				best = index;
				bestDistance = distance;
			}
		});
		return best;
	};

	const notes = expected.map((target): ScoredNote => {
		const match = nearest(target, (note) => same(target, note));
		if (match >= 0) {
			used.add(match);
			const deltaMs = played[match].time - target.time;
			const outcome: NoteOutcome =
				Math.abs(deltaMs) <= toleranceMs ? 'correct' : deltaMs < 0 ? 'early' : 'late';
			return { id: target.id, outcome, deltaMs };
		}
		const wrong = nearest(target, () => true);
		if (wrong >= 0) {
			used.add(wrong);
			return { id: target.id, outcome: 'wrong' };
		}
		return { id: target.id, outcome: 'missed' };
	});

	const extras = played.filter((_, index) => !used.has(index));
	const total = Math.max(expected.length, 1);
	const pitchCorrect = notes.filter(
		(n) => n.outcome === 'correct' || n.outcome === 'early' || n.outcome === 'late'
	).length;
	const onTime = notes.filter((n) => n.outcome === 'correct').length;
	return {
		notes,
		extras,
		pitchAccuracy: Math.round((pitchCorrect / total) * 100),
		rhythmAccuracy: Math.round((onTime / total) * 100)
	};
}

export function resultsCommentary(summary: ScoreSummary<Timed>): string {
	const counts = summary.notes.reduce<Record<string, number>>((acc, note) => {
		acc[note.outcome] = (acc[note.outcome] ?? 0) + 1;
		return acc;
	}, {});
	const missed = (counts.missed ?? 0) + (counts.wrong ?? 0);
	const late = counts.late ?? 0;
	const early = counts.early ?? 0;
	if (summary.pitchAccuracy >= 95 && summary.rhythmAccuracy >= 90) {
		return m.commentary_clean();
	}
	if (missed > late + early) {
		return m.commentary_pitches();
	}
	if (late > early) {
		return m.commentary_late();
	}
	return m.commentary_rush();
}
