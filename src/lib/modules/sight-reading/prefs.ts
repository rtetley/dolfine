import { m } from '#lib/i18n.ts';
import type { Level } from '#lib/music/levels.ts';
import type { SightReadingDrill } from '#lib/music/sightReadingLevels.ts';

export type StaffChoice = 'treble' | 'bass' | 'grand';
export type ReadingMode = 'performance' | 'practice';
export type MetronomeChoice = 'on' | 'off' | 'random-mute';
export type KeyModeChoice = 'major' | 'minor' | 'either';
/** `voice`: the student says the note names aloud and the microphone checks name and timing. */
export type AnswerInput = 'midi' | 'voice';

export interface SightReadingPrefs extends Record<string, unknown> {
	level: Level;
	/** The level's drill: its new element ("focus"), a review, or a level 9 rhythm figure. */
	exercise: SightReadingDrill;
	staff: StaffChoice;
	mode: ReadingMode;
	input: AnswerInput;
	metronome: MetronomeChoice;
	cursor: boolean;
	referenceNotes: boolean;
	keyMode: KeyModeChoice;
	keyFifths: string;
	meter: string;
	tempo: number;
	bars: number;
	previewSeconds: number;
}

export const SIGHT_READING_DEFAULTS: SightReadingPrefs = {
	level: 1,
	exercise: 'focus',
	staff: 'treble',
	mode: 'performance',
	input: 'midi',
	metronome: 'on',
	cursor: true,
	referenceNotes: true,
	keyMode: 'major',
	keyFifths: 'level',
	meter: 'level',
	tempo: 0,
	bars: 0,
	previewSeconds: 30
};

export const METER_OPTIONS = ['level', '2/4', '3/4', '4/4', '6/8', '12/8', '5/8', '7/8'] as const;

export const STAFF_LABELS: Record<StaffChoice, string> = {
	get treble() {
		return m.staff_treble_short();
	},
	get bass() {
		return m.staff_bass_short();
	},
	get grand() {
		return m.staff_grand_short();
	}
};
