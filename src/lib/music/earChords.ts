import type { Level } from './levels';

export interface EarChordQuality {
	id: string;
	symbol: string;
	intervals: readonly number[];
}

export const EAR_CHORDS: readonly EarChordQuality[] = [
	{ id: 'maj7', symbol: 'Δ7', intervals: [0, 4, 7, 11] },
	{ id: 'm7', symbol: '-7', intervals: [0, 3, 7, 10] },
	{ id: 'dom7', symbol: '7', intervals: [0, 4, 7, 10] },
	{ id: 'm7b5', symbol: 'ø7', intervals: [0, 3, 6, 10] },
	{ id: 'dim7', symbol: '°7', intervals: [0, 3, 6, 9] },
	{ id: 'mMaj7', symbol: '-Δ7', intervals: [0, 3, 7, 11] },
	{ id: '7sus4', symbol: '7sus4', intervals: [0, 5, 7, 10] },
	{ id: 'maj7s5', symbol: 'Δ7(♯5)', intervals: [0, 4, 8, 11] },
	{ id: 'maj9', symbol: 'Δ9', intervals: [0, 4, 7, 11, 14] },
	{ id: 'm9', symbol: '-9', intervals: [0, 3, 7, 10, 14] },
	{ id: 'dom9', symbol: '9', intervals: [0, 4, 7, 10, 14] },
	{ id: 'maj7s11', symbol: 'Δ7(♯11)', intervals: [0, 4, 7, 11, 14, 18] },
	{ id: 'm11', symbol: '-11', intervals: [0, 3, 7, 10, 14, 17] },
	{ id: 'dom13', symbol: '13', intervals: [0, 4, 10, 14, 21] },
	{ id: 'dom7s11', symbol: '7(♯11)', intervals: [0, 4, 7, 10, 14, 18] },
	{ id: 'dom7b9', symbol: '7(♭9)', intervals: [0, 4, 7, 10, 13] },
	{ id: 'dom7b13', symbol: '7(♭13)', intervals: [0, 4, 10, 14, 20] },
	{ id: 'alt', symbol: '7alt', intervals: [0, 4, 10, 13, 15, 20] },
	{ id: 'dom7b9b13', symbol: '7(♭9 ♭13)', intervals: [0, 4, 10, 13, 20] },
	{ id: 'sus4b9', symbol: '7sus4(♭9)', intervals: [0, 5, 10, 13, 21] },
	{ id: 'maj7s9', symbol: 'Δ7(♯9)', intervals: [0, 4, 7, 11, 15] },
	{ id: 'm7s11', symbol: '-7(♯11)', intervals: [0, 3, 7, 10, 18] },
	{ id: 'us-d-over-c7', symbol: '13(♯11) · D/C7', intervals: [0, 4, 10, 14, 18, 21] },
	{ id: 'us-eb-over-c7', symbol: '7(♯9 ♭13) · E♭/C7', intervals: [0, 4, 10, 15, 19, 22] },
	{ id: 'quartal', symbol: 'quartal (-11)', intervals: [0, 5, 10, 15, 19] }
];

const ids = (...list: string[]): string[] => list;

const LADDER: Record<Level, string[]> = {
	1: ids('maj7', 'm7', 'dom7', 'm7b5'),
	2: ids('maj7', 'm7', 'dom7', 'm7b5', 'dim7'),
	3: ids('maj7', 'm7', 'dom7', 'm7b5', 'dim7', 'mMaj7', '7sus4', 'maj7s5'),
	4: ids('maj7', 'm7', 'dom7', 'mMaj7', '7sus4', 'maj9', 'm9', 'dom9'),
	5: ids('maj9', 'm9', 'dom9', 'maj7s11', 'm11', 'dom13', 'dom7s11'),
	6: ids('maj7s11', 'm11', 'dom13', 'dom7s11', 'dom7b9', 'dom7b13'),
	7: ids('dom7b9', 'dom7b13', 'alt', 'dom7b9b13', 'sus4b9', 'maj7s9', 'm7s11'),
	8: ids('alt', 'dom7b9b13', 'sus4b9', 'maj7s9', 'm7s11', 'mMaj7', 'maj7s5'),
	9: ids('alt', 'dom13', 'dom7s11', 'us-d-over-c7', 'us-eb-over-c7', 'quartal'),
	10: ids('alt', 'dom7b9b13', 'sus4b9', 'us-d-over-c7', 'us-eb-over-c7', 'quartal', 'maj7s9')
};

export function earChordsForLevel(level: Level): EarChordQuality[] {
	const wanted = LADDER[level];
	return EAR_CHORDS.filter((quality) => wanted.includes(quality.id));
}

export const earChordById = (id: string): EarChordQuality | undefined =>
	EAR_CHORDS.find((q) => q.id === id);

export type EarVoicing = 'close' | 'shell-spread' | 'rootless' | 'drop2';

export const EAR_VOICINGS_BY_LEVEL: Record<Level, EarVoicing[]> = {
	1: ['shell-spread'],
	2: ['shell-spread'],
	3: ['shell-spread', 'rootless'],
	4: ['shell-spread', 'rootless'],
	5: ['rootless', 'drop2'],
	6: ['rootless', 'drop2'],
	7: ['rootless', 'drop2', 'close'],
	8: ['rootless', 'drop2', 'close'],
	9: ['rootless', 'drop2', 'close'],
	10: ['rootless', 'drop2', 'close']
};

export function voiceEarChord(
	rootMidi: number,
	quality: EarChordQuality,
	voicing: EarVoicing
): number[] {
	const upper = quality.intervals.slice(1);
	switch (voicing) {
		case 'close':
			return [rootMidi, ...upper.map((i) => rootMidi + 12 + (i % 12)).sort((a, b) => a - b)];
		case 'rootless':
			return [
				rootMidi - 12,
				...upper.map((i) => rootMidi + (i % 12) + (i % 12 < 3 ? 12 : 0)).sort((a, b) => a - b)
			];
		case 'drop2': {
			const close = upper.map((i) => rootMidi + 12 + (i % 12)).sort((a, b) => a - b);
			const second = close.at(-2);
			const dropped = close
				.map((midi) => (midi === second ? midi - 12 : midi))
				.sort((a, b) => a - b);
			return [rootMidi, ...dropped];
		}
		case 'shell-spread':
			return [
				rootMidi,
				...upper
					.map((i, index) => rootMidi + i + (index === 0 ? 12 : i < 12 ? 12 : 0))
					.sort((a, b) => a - b)
			];
	}
}

export const INTERVAL_NAMES: readonly string[] = [
	'Unison',
	'Minor 2nd',
	'Major 2nd',
	'Minor 3rd',
	'Major 3rd',
	'Perfect 4th',
	'Tritone',
	'Perfect 5th',
	'Minor 6th',
	'Major 6th',
	'Minor 7th',
	'Major 7th',
	'Octave'
];

export const INTERVALS_BY_LEVEL: Record<Level, number[]> = {
	1: [3, 4, 5, 7, 12],
	2: [2, 3, 4, 5, 7, 9, 12],
	3: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
	4: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
	5: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
	6: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
	7: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
	8: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
	9: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
	10: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
};
