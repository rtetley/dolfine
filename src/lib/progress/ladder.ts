import { LEVELS, type Level } from '#lib/music/levels.ts';
import type { EarSubmodule } from '#lib/modules/ear/questions.ts';

/**
 * The progress ladder for the graded modules (music theory and ear training).
 *
 * A level unlocks the next one once the student gets {@link REQUIRED_CORRECT} of their last
 * {@link UNLOCK_WINDOW} answers right at that level (90 %). The numbers are a draft, to be
 * reviewed with conservatory teachers along with the level mappings.
 *
 * Everything here is pure: the store in `#lib/state/progress.svelte.ts` keeps the state and
 * decides where it is saved.
 */

export const UNLOCK_WINDOW = 20;
export const UNLOCK_ACCURACY = 0.9;
export const REQUIRED_CORRECT = Math.ceil(UNLOCK_WINDOW * UNLOCK_ACCURACY);

export type TrackId = 'theory' | `ear:${EarSubmodule}`;
export type GradedModule = 'theory' | 'ear';

/** The ear sub-modules, repeated here (type-checked) so pages can read progress without loading the generators. */
export const EAR_TRACK_SUBMODULES = [
	'intervals',
	'chords',
	'voicings',
	'modes',
	'progressions'
] as const satisfies readonly EarSubmodule[];

export const earTrack = (submodule: EarSubmodule): TrackId => `ear:${submodule}`;
export const EAR_TRACKS: readonly TrackId[] = EAR_TRACK_SUBMODULES.map(earTrack);
export const TRACKS: readonly TrackId[] = ['theory', ...EAR_TRACKS];
export const MODULE_TRACKS: Record<GradedModule, readonly TrackId[]> = {
	theory: ['theory'],
	ear: EAR_TRACKS
};

export interface LevelRecord {
	/** The most recent answers at this level, oldest first, at most {@link UNLOCK_WINDOW}. */
	recent: boolean[];
	answered: number;
	correct: number;
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

export interface LevelStanding {
	level: Level;
	/** Right answers among the last {@link UNLOCK_WINDOW} at this level. */
	recentCorrect: number;
	recentAnswered: number;
	/** 0–1: how far the student is towards unlocking the next level. */
	ratio: number;
	passed: boolean;
}

export function levelStanding(track: TrackProgress, level: Level): LevelStanding {
	const recent = track.levels[level]?.recent ?? [];
	const recentCorrect = recent.filter(Boolean).length;
	const passed = level < track.unlocked || recentCorrect >= REQUIRED_CORRECT;
	return {
		level,
		recentCorrect,
		recentAnswered: recent.length,
		ratio: passed ? 1 : recentCorrect / REQUIRED_CORRECT,
		passed
	};
}

export const percent = (ratio: number): number => Math.round(Math.min(1, Math.max(0, ratio)) * 100);

export const hasPractised = (state: ProgressState, track: TrackId): boolean =>
	Object.values(trackOf(state, track).levels).some((record) => (record?.answered ?? 0) > 0);

/**
 * The level the app estimates for a module: the open level of a single-track module, or the
 * rounded mean over the sub-modules the student has practised.
 */
export function estimatedLevel(state: ProgressState, module: GradedModule): Level {
	const tracks = MODULE_TRACKS[module];
	const practised = tracks.filter((track) => hasPractised(state, track));
	const counted = practised.length > 0 ? practised : tracks;
	const mean =
		counted.reduce((sum, track) => sum + trackOf(state, track).unlocked, 0) / counted.length;
	return clampLevel(Math.round(mean));
}

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
