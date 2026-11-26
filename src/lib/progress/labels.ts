import { m } from '#lib/i18n.ts';
import type { AchievementId } from './achievements';
import type { Level } from '#lib/music/levels.ts';
import type { TrackId } from './ladder';

/** The module a track belongs to: "Music theory". */
export const trackLabel = (track: TrackId): string =>
	track === 'theory' ? m.nav_theory() : m.nav_ear();

const THEORY_STAGE_TITLES: Record<Level, () => string> = {
	1: m.stage_theory_1,
	2: m.stage_theory_2,
	3: m.stage_theory_3,
	4: m.stage_theory_4,
	5: m.stage_theory_5,
	6: m.stage_theory_6,
	7: m.stage_theory_7,
	8: m.stage_theory_8,
	9: m.stage_theory_9,
	10: m.stage_theory_10
};

const EAR_STAGE_TITLES: Record<Level, () => string> = {
	1: m.stage_ear_1,
	2: m.stage_ear_2,
	3: m.stage_ear_3,
	4: m.stage_ear_4,
	5: m.stage_ear_5,
	6: m.stage_ear_6,
	7: m.stage_ear_7,
	8: m.stage_ear_8,
	9: m.stage_ear_9,
	10: m.stage_ear_10
};

/** What a level of a graded module is about: "The major scale". */
export const stageTitle = (track: TrackId, level: Level): string =>
	(track === 'theory' ? THEORY_STAGE_TITLES : EAR_STAGE_TITLES)[level]();

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
