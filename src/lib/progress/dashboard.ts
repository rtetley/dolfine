import type { Level } from '#lib/music/levels.ts';
import type { ModuleId } from '#lib/state/modulePrefs.svelte.ts';
import {
	EAR_TRACK_SUBMODULES,
	earTrack,
	estimatedLevel,
	hasPractised,
	isLevel,
	levelStanding,
	percent,
	type ProgressState,
	type TrackId,
	trackOf
} from './ladder';

/** What the dashboard shows for a graded module (music theory, ear training). */
export interface GradedStatus {
	graded: true;
	/** The badge: the app's estimate of the student's level in this module. */
	estimate: Level;
	/** The track the student is on now (the ear sub-module last chosen). */
	track: TrackId;
	/** The open level on that track, and how far they are towards the next one. */
	level: Level;
	percent: number;
	atTop: boolean;
	started: boolean;
}

/** What the dashboard shows for a module that isn't graded yet. */
export interface UngradedStatus {
	graded: false;
	/** The level last chosen in setup, or null if the module was never opened. */
	level: Level | null;
}

export type ModuleStatus = GradedStatus | UngradedStatus;

/** The saved setup of each module, as far as the dashboard needs it. */
export type SavedPrefs = Partial<Record<ModuleId, Record<string, unknown>>>;

function graded(state: ProgressState, module: 'theory' | 'ear', track: TrackId): GradedStatus {
	const progress = trackOf(state, track);
	const standing = levelStanding(progress, progress.unlocked);
	return {
		graded: true,
		estimate: estimatedLevel(state, module),
		track,
		level: progress.unlocked,
		percent: percent(standing.ratio),
		atTop: progress.unlocked === 10 && standing.passed,
		started: progress.unlocked > 1 || hasPractised(state, track)
	};
}

const savedLevel = (prefs: Record<string, unknown> | undefined): Level | null =>
	isLevel(prefs?.level) ? prefs.level : null;

const savedEarTrack = (prefs: Record<string, unknown> | undefined): TrackId => {
	const submodule = EAR_TRACK_SUBMODULES.find((s) => s === prefs?.submodule);
	return earTrack(submodule ?? 'chords');
};

export function moduleStatuses(
	state: ProgressState,
	prefs: SavedPrefs
): Record<ModuleId, ModuleStatus> {
	return {
		'sight-reading': { graded: false, level: savedLevel(prefs['sight-reading']) },
		rhythm: { graded: false, level: savedLevel(prefs.rhythm) },
		theory: graded(state, 'theory', 'theory'),
		ear: graded(state, 'ear', savedEarTrack(prefs.ear))
	};
}
