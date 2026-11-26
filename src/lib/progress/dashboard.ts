import type { Level } from '#lib/music/levels.ts';
import type { ModuleId } from '#lib/state/modulePrefs.svelte.ts';
import {
	type GradedModule,
	hasPractised,
	isLevel,
	moduleStanding,
	percent,
	type ProgressState,
	trackOf
} from './ladder';

/** What the dashboard shows for a graded module (music theory, ear training). */
export interface GradedStatus {
	graded: true;
	/** The open level, and how far the student is towards the next one. */
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

function graded(state: ProgressState, module: GradedModule): GradedStatus {
	const { unlocked } = trackOf(state, module);
	const standing = moduleStanding(state, module, unlocked);
	return {
		graded: true,
		level: unlocked,
		percent: percent(standing.ratio),
		atTop: unlocked === 10 && standing.passed,
		started: unlocked > 1 || hasPractised(state, module)
	};
}

const savedLevel = (prefs: Record<string, unknown> | undefined): Level | null =>
	isLevel(prefs?.level) ? prefs.level : null;

export function moduleStatuses(
	state: ProgressState,
	prefs: SavedPrefs
): Record<ModuleId, ModuleStatus> {
	return {
		'sight-reading': { graded: false, level: savedLevel(prefs['sight-reading']) },
		rhythm: { graded: false, level: savedLevel(prefs.rhythm) },
		theory: graded(state, 'theory'),
		ear: graded(state, 'ear')
	};
}
