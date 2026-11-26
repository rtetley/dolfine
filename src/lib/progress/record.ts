import type { Level } from '#lib/music/levels.ts';
import { type AchievementId, newlyEarned } from './achievements';
import {
	emptyTrack,
	levelStanding,
	type ProgressState,
	type TrackId,
	trackOf,
	UNLOCK_WINDOW,
	xpFor
} from './ladder';

export interface Answer {
	track: TrackId;
	level: Level;
	correct: boolean;
	/** Local `YYYY-MM-DD`. */
	today: string;
}

export type ProgressEvent =
	| { kind: 'xp'; amount: number }
	| { kind: 'level-unlocked'; track: TrackId; level: Level }
	| { kind: 'achievement'; id: AchievementId };

export interface Recorded {
	state: ProgressState;
	events: ProgressEvent[];
}

/** Folds one checked answer into the progress state. Pure: returns a new state. */
export function recordAnswer(state: ProgressState, answer: Answer): Recorded {
	const { track: trackId, level, correct, today } = answer;
	const track = trackOf(state, trackId);
	const record = track.levels[level] ?? { recent: [], answered: 0, correct: 0 };
	const updatedRecord = {
		recent: [...record.recent, correct].slice(-UNLOCK_WINDOW),
		answered: record.answered + 1,
		correct: record.correct + (correct ? 1 : 0)
	};
	let updatedTrack = { ...emptyTrack(track.unlocked), levels: { ...track.levels } };
	updatedTrack.levels[level] = updatedRecord;

	const events: ProgressEvent[] = [];
	const amount = xpFor(level, correct);
	events.push({ kind: 'xp', amount });

	// Passing any level at or above the frontier opens the one after it (or holds the top).
	if (level >= track.unlocked && levelStanding(updatedTrack, level).passed) {
		const next = Math.min(10, level + 1) as Level;
		if (next > track.unlocked) {
			updatedTrack = { ...updatedTrack, unlocked: next };
			events.push({ kind: 'level-unlocked', track: trackId, level: next });
		}
	}

	const run = correct ? state.run + 1 : 0;
	const next: ProgressState = {
		...state,
		xp: state.xp + amount,
		answered: state.answered + 1,
		correct: state.correct + (correct ? 1 : 0),
		run,
		bestRun: Math.max(state.bestRun, run),
		days: state.days.includes(today) ? state.days : [...state.days, today].sort().slice(-400),
		tracks: { ...state.tracks, [trackId]: updatedTrack }
	};

	const earned = newlyEarned(next, today);
	if (earned.length > 0) {
		next.achievements = {
			...next.achievements,
			...Object.fromEntries(earned.map((id) => [id, today]))
		};
		events.push(...earned.map((id) => ({ kind: 'achievement', id }) as const));
	}
	return { state: next, events };
}

/**
 * Places the student on a track without making them climb from Level 1: the levels below
 * count as passed. Used when a student says where they stand; it never lowers a track.
 */
export function placeOnLevel(state: ProgressState, track: TrackId, level: Level): ProgressState {
	const current = trackOf(state, track);
	if (current.unlocked >= level) return state;
	return { ...state, tracks: { ...state.tracks, [track]: { ...current, unlocked: level } } };
}
