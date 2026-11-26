import { m } from '#lib/i18n.ts';
import type { LessonSection } from './lessonPlan';
import type { LessonId, VoicingKind } from './lessons';

export interface LessonText {
	title: () => string;
	summary: () => string;
	paragraphs: () => string[];
	/** The "going further" section: what the lesson opens onto. */
	further: () => string[];
}

export const LESSON_TEXT: Record<LessonId, LessonText> = {
	major: {
		title: m.lesson_major_title,
		summary: m.lesson_major_summary,
		paragraphs: () => [m.lesson_major_p1(), m.lesson_major_p2()],
		further: () => [m.lesson_major_further_p1(), m.lesson_major_further_p2()]
	},
	'chord-colours': {
		title: m.lesson_chord_colours_title,
		summary: m.lesson_chord_colours_summary,
		paragraphs: () => [m.lesson_chord_colours_p1(), m.lesson_chord_colours_p2()],
		further: () => [m.lesson_chord_colours_further_p1()]
	},
	'four-colours': {
		title: m.lesson_four_colours_title,
		summary: m.lesson_four_colours_summary,
		paragraphs: () => [m.lesson_four_colours_p1(), m.lesson_four_colours_p2()],
		further: () => [m.lesson_four_colours_further_p1()]
	},
	'melodic-minor': {
		title: m.lesson_melodic_minor_title,
		summary: m.lesson_melodic_minor_summary,
		paragraphs: () => [m.lesson_melodic_minor_p1(), m.lesson_melodic_minor_p2()],
		further: () => [m.lesson_melodic_minor_further_p1()]
	},
	'harmonic-minor': {
		title: m.lesson_harmonic_minor_title,
		summary: m.lesson_harmonic_minor_summary,
		paragraphs: () => [m.lesson_harmonic_minor_p1(), m.lesson_harmonic_minor_p2()],
		further: () => [m.lesson_harmonic_minor_further_p1()]
	},
	voicings: {
		title: m.lesson_voicings_title,
		summary: m.lesson_voicings_summary,
		paragraphs: () => [m.lesson_voicings_p1(), m.lesson_voicings_p2()],
		further: () => [m.lesson_voicings_further_p1()]
	}
};

export const VOICING_TEXT: Record<VoicingKind, { name: () => string; about: () => string }> = {
	close: { name: m.voicing_close, about: m.voicing_close_about },
	drop2: { name: m.voicing_drop2, about: m.voicing_drop2_about },
	'shell-37': { name: m.voicing_shell_37, about: m.voicing_shell_37_about },
	'shell-73': { name: m.voicing_shell_73, about: m.voicing_shell_73_about },
	'rootless-a': { name: m.voicing_rootless_a, about: m.voicing_rootless_a_about },
	'rootless-b': { name: m.voicing_rootless_b, about: m.voicing_rootless_b_about },
	'type-a': { name: m.voicing_type_a, about: m.voicing_type_a_about },
	'type-b': { name: m.voicing_type_b, about: m.voicing_type_b_about }
};

export const SECTION_TITLES: Record<LessonSection, () => string> = {
	intro: m.lesson_section_intro,
	harmonization: m.lesson_section_harmonization,
	modes: m.lesson_section_modes,
	colours: m.lesson_section_colours,
	voicings: m.lesson_section_voicings,
	further: m.lesson_section_further,
	exercises: m.lesson_section_exercises
};
