import { m } from '#lib/i18n.ts';
import type { ColourId, ColourScale } from '#lib/music/colours.ts';

/** How each colour sounds and where it is heard. */
export const COLOUR_TEXT: Record<ColourId, () => string> = {
	maj9: m.colour_maj9,
	'69': m.colour_69,
	mMaj9: m.colour_mMaj9,
	m69: m.colour_m69,
	m9: m.colour_m9,
	m7b5: m.colour_m7b5,
	dim: m.colour_dim,
	'9': m.colour_9,
	'9sus4': m.colour_9sus4,
	'9#5': m.colour_9sharp5,
	'7b9': m.colour_7b9,
	'7#9': m.colour_7sharp9,
	m11: m.colour_m11,
	'7b9sus4': m.colour_7b9sus4,
	'maj9#11': m.colour_maj9sharp11,
	m7b6: m.colour_m7b6
};

export const COLOUR_SCALE_NAMES: Record<ColourScale, () => string> = {
	ionian: m.colour_scale_ionian,
	ionianFlat3: m.colour_scale_ionianFlat3,
	dorian: m.colour_scale_dorian,
	phrygian: m.colour_scale_phrygian,
	lydian: m.colour_scale_lydian,
	mixolydian: m.colour_scale_mixolydian,
	aeolian: m.colour_scale_aeolian,
	locrian: m.colour_scale_locrian,
	wholeHalf: m.colour_scale_wholeHalf,
	wholeTone: m.colour_scale_wholeTone,
	phrygianDominant: m.colour_scale_phrygianDominant,
	blues: m.colour_scale_blues
};
