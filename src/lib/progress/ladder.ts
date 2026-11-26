import { LEVELS, type Level } from '#lib/music/levels.ts';
import { exercisesAt, type GradedModule } from './curriculum';

/**
 * The progress ladder for the graded modules (music theory and ear training).
 *
 * Each level has a few exercises (see `curriculum.ts`). An exercise gets its grade once the
 * student answers {@link REQUIRED_CORRECT} of their last {@link UNLOCK_WINDOW} questions right
 * (90 %), and the next level opens once every exercise of this one has its grade. The numbers
 * are a draft, to be reviewed with conservatory teachers along with the level mappings.
 *
 * Everything here is pure: the store in `#lib/state/progress.svelte.ts` keeps the state and
 * decides where it is saved.
 */

export const UNLOCK_WINDOW = 20;
export const UNLOCK_ACCURACY = 0.9;
export const REQUIRED_CORRECT = Math.ceil(UNLOCK_WINDOW * UNLOCK_ACCURACY);

export type { GradedModule };
export type TrackId = GradedModule;
export const TRACKS: readonly TrackId[] = ['theory', 'ear'];

export interface DrillRecord {
	/** The most recent answers to this exercise, oldest first, at most {@link UNLOCK_WINDOW}. */
	recent: boolean[];
	answered: number;
	correct: number;
}

export interface LevelRecord {
	answered: number;
	correct: number;
	drills: Partial<Record<string, DrillRecord>>;
}

export interface TrackProgress {
	/** Highest level open to the student on this track. */
	unlocked: Level;
	levels: Partial<Record<Level, LevelRecord>>;
}

export interface ProgressState {
	xp: number;
	answered: number;
	correct: number;
	/** Correct answers in a row, across every track. */
	run: number;
	bestRun: number;
	/** Days with at least one answer, as sorted `YYYY-MM-DD` strings. */
	days: string[];
	tracks: Partial<Record<TrackId, TrackProgress>>;
	/** Achievements earned, with the day each was earned. */
	achievements: Record<string, string>;
}

export const emptyProgress = (): ProgressState => ({
	xp: 0,
	answered: 0,
	correct: 0,
	run: 0,
	bestRun: 0,
	days: [],
	tracks: {},
	achievements: {}
});

export const emptyTrack = (unlocked: Level = 1): TrackProgress => ({ unlocked, levels: {} });

export const trackOf = (state: ProgressState, track: TrackId): TrackProgress =>
	state.tracks[track] ?? emptyTrack();

/** XP for one answer: harder levels pay more, and a wrong answer still earns a point for trying. */
export const xpFor = (level: Level, correct: boolean): number => (correct ? 8 + 2 * level : 1);

export interface DrillStanding {
	exercise: string;
	/** Right answers among the last {@link UNLOCK_WINDOW} to this exercise at this level. */
	recentCorrect: number;
	recentAnswered: number;
	/** 0–1: how far the student is towards this exercise's grade. */
	ratio: number;
	passed: boolean;
}

export interface LevelStanding {
	level: Level;
	drills: DrillStanding[];
	/** 0–1: the mean progress over the level's exercises. */
	ratio: number;
	passed: boolean;
}

export function drillStanding(track: TrackProgress, level: Level, exercise: string): DrillStanding {
	const recent = track.levels[level]?.drills[exercise]?.recent ?? [];
	const recentCorrect = recent.filter(Boolean).length;
	const passed = level < track.unlocked || recentCorrect >= REQUIRED_CORRECT;
	return {
		exercise,
		recentCorrect,
		recentAnswered: recent.length,
		ratio: passed ? 1 : recentCorrect / REQUIRED_CORRECT,
		passed
	};
}

export function levelStanding(
	track: TrackProgress,
	level: Level,
	exercises: readonly string[]
): LevelStanding {
	const drills = exercises.map((exercise) => drillStanding(track, level, exercise));
	const ratio =
		drills.length > 0 ? drills.reduce((sum, drill) => sum + drill.ratio, 0) / drills.length : 1;
	return { level, drills, ratio, passed: drills.every((drill) => drill.passed) };
}

/** The standing of a graded module at one of its levels, against that level's exercises. */
export const moduleStanding = (
	state: ProgressState,
	module: GradedModule,
	level: Level
): LevelStanding => levelStanding(trackOf(state, module), level, exercisesAt(module, level));

export const percent = (ratio: number): number => Math.round(Math.min(1, Math.max(0, ratio)) * 100);

export const hasPractised = (state: ProgressState, track: TrackId): boolean =>
	Object.values(trackOf(state, track).levels).some((record) => (record?.answered ?? 0) > 0);

/** Every exercise the student has answered on a track, at any level. */
export const practisedExercises = (state: ProgressState, track: TrackId): Set<string> =>
	new Set(
		Object.values(trackOf(state, track).levels).flatMap((record) =>
			Object.entries(record?.drills ?? {}).flatMap(([exercise, drill]) =>
				(drill?.answered ?? 0) > 0 ? [exercise] : []
			)
		)
	);

export const clampLevel = (value: number): Level =>
	Math.min(10, Math.max(1, Math.trunc(value) || 1)) as Level;

export const isLevel = (value: unknown): value is Level =>
	typeof value === 'number' && (LEVELS as readonly number[]).includes(value);

/** Consecutive practice days ending today, or yesterday if today has no answer yet. */
export function dayStreak(days: readonly string[], today: string): number {
	const practised = new Set(days);
	let cursor = practised.has(today) ? today : shiftDay(today, -1);
	let streak = 0;
	while (practised.has(cursor)) {
		streak++;
		cursor = shiftDay(cursor, -1);
	}
	return streak;
}

export function shiftDay(day: string, by: number): string {
	const date = new Date(`${day}T12:00:00Z`);
	date.setUTCDate(date.getUTCDate() + by);
	return date.toISOString().slice(0, 10);
}

/** The local calendar day, so a late-evening session still counts for that evening. */
export function localDay(date = new Date()): string {
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
