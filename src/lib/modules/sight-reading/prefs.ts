import type { Level } from '#lib/music/levels.ts';

export type StaffChoice = 'treble' | 'bass' | 'grand';
export type ReadingMode = 'performance' | 'practice';
export type MetronomeChoice = 'on' | 'off' | 'random-mute';
export type KeyModeChoice = 'major' | 'minor' | 'either';

export interface SightReadingPrefs extends Record<string, unknown> {
	level: Level;
	staff: StaffChoice;
	mode: ReadingMode;
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
	level: 3,
	staff: 'treble',
	mode: 'performance',
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
	treble: 'treble clef',
	bass: 'bass clef',
	grand: 'grand staff'
};
