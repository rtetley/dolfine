import { EAR_SUBMODULES_GRADED } from './curriculum';
import {
	dayStreak,
	hasPractised,
	practisedExercises,
	type ProgressState,
	TRACKS,
	trackOf
} from './ladder';

/**
 * Achievements: quiet milestones in the editorial voice of the app, earned once and kept.
 * Each has a test on the progress state; `recordAnswer` checks them after every answer.
 */

export const ACHIEVEMENTS = [
	'first-answer',
	'correct-10',
	'correct-100',
	'correct-500',
	'run-10',
	'run-25',
	'days-3',
	'days-7',
	'days-30',
	'first-level-up',
	'level-5',
	'level-10',
	'all-ears',
	'theory-and-ear'
] as const;

export type AchievementId = (typeof ACHIEVEMENTS)[number];

const highestLevel = (state: ProgressState): number =>
	Math.max(...TRACKS.map((track) => trackOf(state, track).unlocked));

const EARNED: Record<AchievementId, (state: ProgressState, today: string) => boolean> = {
	'first-answer': (s) => s.answered >= 1,
	'correct-10': (s) => s.correct >= 10,
	'correct-100': (s) => s.correct >= 100,
	'correct-500': (s) => s.correct >= 500,
	'run-10': (s) => s.bestRun >= 10,
	'run-25': (s) => s.bestRun >= 25,
	'days-3': (s, today) => dayStreak(s.days, today) >= 3,
	'days-7': (s, today) => dayStreak(s.days, today) >= 7,
	'days-30': (s, today) => dayStreak(s.days, today) >= 30,
	'first-level-up': (s) => highestLevel(s) >= 2,
	'level-5': (s) => highestLevel(s) >= 5,
	'level-10': (s) => highestLevel(s) >= 10,
	'all-ears': (s) => {
		const practised = practisedExercises(s, 'ear');
		return EAR_SUBMODULES_GRADED.every((submodule) => practised.has(submodule));
	},
	'theory-and-ear': (s) => hasPractised(s, 'theory') && hasPractised(s, 'ear')
};

/** Achievements the state now qualifies for but has not been awarded yet. */
export const newlyEarned = (state: ProgressState, today: string): AchievementId[] =>
	ACHIEVEMENTS.filter((id) => !(id in state.achievements) && EARNED[id](state, today));
