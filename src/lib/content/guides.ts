import { m } from '#lib/i18n.ts';

export interface Guide {
	title: string;
	paragraphs: string[];
}

const guide = (title: () => string, ...paragraphs: (() => string)[]): Guide => ({
	get title() {
		return title();
	},
	get paragraphs() {
		return paragraphs.map((paragraph) => paragraph());
	}
});

export const SIGHT_READING_GUIDES: Record<'intro' | 'dandelot' | 'technique' | 'modes', Guide> = {
	intro: guide(
		m.guide_sight_reading_intro_title,
		m.guide_sight_reading_intro_p1,
		m.guide_sight_reading_intro_p2
	),
	dandelot: guide(
		m.guide_sight_reading_dandelot_title,
		m.guide_sight_reading_dandelot_p1,
		m.guide_sight_reading_dandelot_p2
	),
	technique: guide(
		m.guide_sight_reading_technique_title,
		m.guide_sight_reading_technique_p1,
		m.guide_sight_reading_technique_p2
	),
	modes: guide(
		m.guide_sight_reading_modes_title,
		m.guide_sight_reading_modes_p1,
		m.guide_sight_reading_modes_p2
	)
};

export const RHYTHM_GUIDES: Record<'swing' | 'syllables' | 'polyrhythm' | 'modulation', Guide> = {
	swing: guide(m.guide_rhythm_swing_title, m.guide_rhythm_swing_p1, m.guide_rhythm_swing_p2),
	syllables: guide(m.guide_rhythm_syllables_title, m.guide_rhythm_syllables_p1),
	polyrhythm: guide(
		m.guide_rhythm_polyrhythm_title,
		m.guide_rhythm_polyrhythm_p1,
		m.guide_rhythm_polyrhythm_p2
	),
	modulation: guide(m.guide_rhythm_modulation_title, m.guide_rhythm_modulation_p1)
};

export const THEORY_GUIDES: Record<'intro' | 'voicings' | 'voiceLeading', Guide> = {
	intro: guide(m.guide_theory_intro_title, m.guide_theory_intro_p1, m.guide_theory_intro_p2),
	voicings: guide(
		m.guide_theory_voicings_title,
		m.guide_theory_voicings_p1,
		m.guide_theory_voicings_p2
	),
	voiceLeading: guide(m.guide_theory_voice_leading_title, m.guide_theory_voice_leading_p1)
};

export const EAR_GUIDES: Record<'intro', Guide> = {
	intro: guide(m.guide_ear_intro_title, m.guide_ear_intro_p1, m.guide_ear_intro_p2)
};
