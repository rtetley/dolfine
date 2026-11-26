import { m } from '#lib/i18n.ts';
import type { Level } from '#lib/music/levels.ts';
import type { SightReadingDrill } from '#lib/music/sightReadingLevels.ts';

/** The words of the sight-reading ladder, loaded with it rather than with the page. */

export const SIGHT_READING_DRILL_LABELS: Record<SightReadingDrill, string> = {
	get focus() {
		return m.sight_drill_focus();
	},
	get review() {
		return m.sight_drill_review();
	},
	get dotted() {
		return m.sight_drill_dotted();
	},
	get syncopation() {
		return m.sight_drill_syncopation();
	},
	get compound() {
		return m.sight_drill_compound();
	}
};

const STAGE_ABOUT: Record<Level, () => string> = {
	1: m.sight_stage_about_1,
	2: m.sight_stage_about_2,
	3: m.sight_stage_about_3,
	4: m.sight_stage_about_4,
	5: m.sight_stage_about_5,
	6: m.sight_stage_about_6,
	7: m.sight_stage_about_7,
	8: m.sight_stage_about_8,
	9: m.sight_stage_about_9,
	10: m.sight_stage_about_10
};

/** What each level trains, in a sentence, as the method would introduce it. */
export const stageAbout = (level: Level): string => STAGE_ABOUT[level]();
