export interface ExpectedNote {
	id: string;
	midi: number;
	time: number;
}

export interface PlayedNote {
	midi: number;
	time: number;
}

export type NoteOutcome = 'correct' | 'early' | 'late' | 'wrong' | 'missed';

export interface ScoredNote {
	id: string;
	outcome: NoteOutcome;
	deltaMs?: number;
}

export interface ScoreSummary {
	notes: ScoredNote[];
	extras: PlayedNote[];
	pitchAccuracy: number;
	rhythmAccuracy: number;
}

export function scorePerformance(
	expected: readonly ExpectedNote[],
	played: readonly PlayedNote[],
	toleranceMs: number
): ScoreSummary {
	const searchWindow = Math.max(toleranceMs * 3, 250);
	const used = new Set<number>();

	const nearest = (target: ExpectedNote, predicate: (note: PlayedNote) => boolean): number => {
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
		const match = nearest(target, (note) => note.midi === target.midi);
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

export function resultsCommentary(summary: ScoreSummary): string {
	const counts = summary.notes.reduce<Record<string, number>>((acc, note) => {
		acc[note.outcome] = (acc[note.outcome] ?? 0) + 1;
		return acc;
	}, {});
	const missed = (counts.missed ?? 0) + (counts.wrong ?? 0);
	const late = counts.late ?? 0;
	const early = counts.early ?? 0;
	if (summary.pitchAccuracy >= 95 && summary.rhythmAccuracy >= 90) {
		return 'Clean and steady. Try the next level, or raise the tempo here.';
	}
	if (missed > late + early) {
		return 'Most slips were pitches. Use the preview to find the tricky bars, and read one beat ahead.';
	}
	if (late > early) {
		return 'Notes tended to land late. Keep going after a mistake rather than correcting it.';
	}
	return 'Notes tended to rush. Let the metronome lead, and breathe on long notes.';
}
