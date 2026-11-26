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
	/** For a wrong note, the index of the played event heard in its place. */
	heard?: number;
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
	const searchWindow = searchWindowFor(toleranceMs);
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
			return { id: target.id, outcome: timingOutcome(deltaMs, toleranceMs), deltaMs };
		}
		const wrong = nearest(target, () => true);
		if (wrong >= 0) {
			used.add(wrong);
			return { id: target.id, outcome: 'wrong', heard: wrong };
		}
		return { id: target.id, outcome: 'missed' };
	});

	return summarise(
		notes,
		played.filter((_, index) => !used.has(index)),
		expected.length
	);
}

function summarise<P extends Timed>(
	notes: ScoredNote[],
	extras: P[],
	expectedCount: number
): ScoreSummary<P> {
	const total = Math.max(expectedCount, 1);
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

const searchWindowFor = (toleranceMs: number): number => Math.max(toleranceMs * 3, 250);

const timingOutcome = (deltaMs: number, toleranceMs: number): NoteOutcome =>
	Math.abs(deltaMs) <= toleranceMs ? 'correct' : deltaMs < 0 ? 'early' : 'late';

/** Costs of the in-order alignment: a wrong name beats calling it a miss plus an extra. */
const MISS_COST = 1;
const EXTRA_COST = 0.6;
const WRONG_COST = 0.9;
const TIMING_COST = 0.5;

/**
 * Scores a single line, said or played one note after another, by aligning both sequences in
 * order (an edit distance over time). Unlike matching each note to its nearest event, one stray
 * sound can't take a neighbour's match and leave a note that was played marked missed.
 */
export function scoreInOrder<E extends ExpectedNote, P extends Timed>(
	expected: readonly E[],
	played: readonly P[],
	toleranceMs: number,
	same: (target: E, note: P) => boolean
): ScoreSummary<P> {
	const window = searchWindowFor(toleranceMs);
	const order = played.map((_, index) => index).sort((a, b) => played[a].time - played[b].time);
	const n = expected.length;
	const m = order.length;
	const cost = Array.from({ length: n + 1 }, () => new Float64Array(m + 1));
	const step = Array.from({ length: n + 1 }, () => new Uint8Array(m + 1));
	const MATCH = 1;
	const MISS = 2;
	const EXTRA = 3;
	const matchCost = (i: number, j: number): number => {
		const target = expected[i];
		const note = played[order[j]];
		const delta = Math.abs(note.time - target.time);
		if (delta > window) return Infinity;
		return (delta / window) * TIMING_COST + (same(target, note) ? 0 : WRONG_COST);
	};
	for (let i = 0; i <= n; i++) {
		for (let j = 0; j <= m; j++) {
			if (i === 0 && j === 0) continue;
			let best = Infinity;
			let move = 0;
			if (i > 0 && cost[i - 1][j] + MISS_COST < best) {
				best = cost[i - 1][j] + MISS_COST;
				move = MISS;
			}
			if (j > 0 && cost[i][j - 1] + EXTRA_COST < best) {
				best = cost[i][j - 1] + EXTRA_COST;
				move = EXTRA;
			}
			if (i > 0 && j > 0 && cost[i - 1][j - 1] + matchCost(i - 1, j - 1) < best) {
				best = cost[i - 1][j - 1] + matchCost(i - 1, j - 1);
				move = MATCH;
			}
			cost[i][j] = best;
			step[i][j] = move;
		}
	}
	const notes = new Array<ScoredNote>(n);
	const extras: P[] = [];
	for (let i = n, j = m; i > 0 || j > 0;) {
		const move = step[i][j];
		if (move === MATCH) {
			const target = expected[i - 1];
			const index = order[j - 1];
			const note = played[index];
			const deltaMs = note.time - target.time;
			notes[i - 1] = same(target, note)
				? { id: target.id, outcome: timingOutcome(deltaMs, toleranceMs), deltaMs }
				: { id: target.id, outcome: 'wrong', heard: index };
			i--;
			j--;
		} else if (move === MISS) {
			notes[i - 1] = { id: expected[i - 1].id, outcome: 'missed' };
			i--;
		} else {
			extras.unshift(played[order[j - 1]]);
			j--;
		}
	}
	return summarise(notes, extras, n);
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
