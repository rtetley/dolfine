import { m } from '#lib/i18n.ts';
import type { AchievementId } from './achievements';
import type { TrackId } from './ladder';

const EAR_LABELS: Record<string, () => string> = {
	'ear:intervals': m.ear_submodule_intervals,
	'ear:chords': m.ear_submodule_chords,
	'ear:voicings': m.ear_submodule_voicings,
	'ear:modes': m.ear_submodule_modes,
	'ear:progressions': m.ear_submodule_progressions
};

/** A sub-module name on its own: "Chords". */
export const trackShortLabel = (track: TrackId): string =>
	track === 'theory' ? m.nav_theory() : (EAR_LABELS[track]?.() ?? track);

/** A track with its module: "Ear training · Chords". */
export const trackLabel = (track: TrackId): string =>
	track === 'theory' ? m.nav_theory() : `${m.nav_ear()} · ${trackShortLabel(track)}`;

const ACHIEVEMENT_TEXT: Record<AchievementId, [() => string, () => string]> = {
	'first-answer': [m.achievement_first_answer, m.achievement_first_answer_detail],
	'correct-10': [m.achievement_correct_10, m.achievement_correct_10_detail],
	'correct-100': [m.achievement_correct_100, m.achievement_correct_100_detail],
	'correct-500': [m.achievement_correct_500, m.achievement_correct_500_detail],
	'run-10': [m.achievement_run_10, m.achievement_run_10_detail],
	'run-25': [m.achievement_run_25, m.achievement_run_25_detail],
	'days-3': [m.achievement_days_3, m.achievement_days_3_detail],
	'days-7': [m.achievement_days_7, m.achievement_days_7_detail],
	'days-30': [m.achievement_days_30, m.achievement_days_30_detail],
	'first-level-up': [m.achievement_first_level_up, m.achievement_first_level_up_detail],
	'level-5': [m.achievement_level_5, m.achievement_level_5_detail],
	'level-10': [m.achievement_level_10, m.achievement_level_10_detail],
	'all-ears': [m.achievement_all_ears, m.achievement_all_ears_detail],
	'theory-and-ear': [m.achievement_theory_and_ear, m.achievement_theory_and_ear_detail]
};

export const achievementTitle = (id: AchievementId): string => ACHIEVEMENT_TEXT[id][0]();
export const achievementDetail = (id: AchievementId): string => ACHIEVEMENT_TEXT[id][1]();

export const ROMAN_NUMERALS = [
	'I',
	'II',
	'III',
	'IV',
	'V',
	'VI',
	'VII',
	'VIII',
	'IX',
	'X'
] as const;
