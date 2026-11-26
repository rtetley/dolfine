import { m } from '#lib/i18n.ts';
import type { LessonId } from '#lib/modules/theory/lessons.ts';
import { REQUIRED_CORRECT, UNLOCK_WINDOW } from '#lib/progress/ladder.ts';
import type { ModuleId } from '#lib/state/modulePrefs.svelte.ts';

type Text = () => string;

export interface ModuleIntro {
	title: Text;
	/** Opens with a drop cap. */
	welcome: Text;
	/** The first steps, in order. */
	steps: readonly Text[];
	studyFirst: Text;
	nextLevel: Text;
	/** Theory lessons to read first, in order. */
	lessons: readonly LessonId[];
	/** A module this one builds on or feeds. */
	related?: { module: ModuleId; text: Text };
	/** Graded modules let the student say where they stand instead of climbing from Level 1. */
	graded: boolean;
}

export const MODULE_INTROS: Record<ModuleId, ModuleIntro> = {
	'sight-reading': {
		title: m.intro_sight_reading_title,
		welcome: m.intro_sight_reading_welcome,
		steps: [
			m.intro_sight_reading_step_1,
			m.intro_sight_reading_step_2,
			m.intro_sight_reading_step_3,
			m.intro_sight_reading_step_4
		],
		studyFirst: m.intro_sight_reading_first,
		nextLevel: m.intro_ungraded_next,
		lessons: [],
		related: { module: 'rhythm', text: m.intro_sight_reading_related },
		graded: false
	},
	rhythm: {
		title: m.intro_rhythm_title,
		welcome: m.intro_rhythm_welcome,
		steps: [
			m.intro_rhythm_step_1,
			m.intro_rhythm_step_2,
			m.intro_rhythm_step_3,
			m.intro_rhythm_step_4
		],
		studyFirst: m.intro_rhythm_first,
		nextLevel: m.intro_ungraded_next,
		lessons: [],
		related: { module: 'sight-reading', text: m.intro_rhythm_related },
		graded: false
	},
	theory: {
		title: m.intro_theory_title,
		welcome: m.intro_theory_welcome,
		steps: [
			m.intro_theory_step_1,
			m.intro_theory_step_2,
			m.intro_theory_step_3,
			m.intro_theory_step_4
		],
		studyFirst: m.intro_theory_first,
		nextLevel: () => m.intro_graded_next({ required: REQUIRED_CORRECT, window: UNLOCK_WINDOW }),
		lessons: ['major', 'melodic-minor', 'harmonic-minor', 'voicings'],
		related: { module: 'ear', text: m.intro_theory_related },
		graded: true
	},
	ear: {
		title: m.intro_ear_title,
		welcome: m.intro_ear_welcome,
		steps: [m.intro_ear_step_1, m.intro_ear_step_2, m.intro_ear_step_3, m.intro_ear_step_4],
		studyFirst: m.intro_ear_first,
		nextLevel: () => m.intro_ear_next({ required: REQUIRED_CORRECT, window: UNLOCK_WINDOW }),
		lessons: [],
		related: { module: 'theory', text: m.intro_ear_related },
		graded: true
	}
};

export interface TourStep {
	title: Text;
	text: Text;
	/** `data-tour` value of the element to point at, if any. */
	target?: string;
}

export const TOUR_STEPS: readonly TourStep[] = [
	{ title: m.tour_welcome_title, text: m.tour_welcome_text },
	{ title: m.tour_modules_title, text: m.tour_modules_text, target: 'modules' },
	{ title: m.tour_levels_title, text: m.tour_levels_text, target: 'nav-progress' },
	{ title: m.tour_settings_title, text: m.tour_settings_text, target: 'nav-settings' },
	{ title: m.tour_input_title, text: m.tour_input_text },
	{ title: m.tour_start_title, text: m.tour_start_text }
];
