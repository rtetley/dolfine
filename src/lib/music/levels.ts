import type { ProgressionKind } from './progressions';
import type { ParentScale } from './scales';

export const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
export type Level = (typeof LEVELS)[number];

export const CLASSICAL_MAPPING: Record<Level, { abrsm: string; french: string }> = {
	1: { abrsm: 'Grade 3', french: 'Start of cycle 2' },
	2: { abrsm: 'Grade 4', french: 'Cycle 2' },
	3: { abrsm: 'Grade 5', french: 'End of cycle 2 (BEM)' },
	4: { abrsm: 'Grade 6', french: 'Start of cycle 3' },
	5: { abrsm: 'Grade 7', french: 'Cycle 3' },
	6: { abrsm: 'Grade 8', french: 'End of cycle 3 (CEM)' },
	7: { abrsm: 'ARSM', french: 'DEM / CPES' },
	8: { abrsm: 'DipABRSM', french: 'Entrance to higher education' },
	9: { abrsm: 'LRSM', french: 'Higher education (DNSPM)' },
	10: { abrsm: 'FRSM', french: 'Professional / concert level' }
};

export const JAZZ_MAPPING: Record<Level, { abrsm: string; french: string }> = {
	1: { abrsm: 'Jazz Grade 1', french: 'Cycle 1' },
	2: { abrsm: 'Jazz Grade 2', french: 'Cycle 1' },
	3: { abrsm: 'Jazz Grade 3', french: 'Cycle 2' },
	4: { abrsm: 'Jazz Grade 4', french: 'Cycle 2' },
	5: { abrsm: 'Jazz Grade 5', french: 'End of cycle 2' },
	6: { abrsm: 'Beyond the jazz grades', french: 'Cycle 3 (CEM)' },
	7: { abrsm: 'Beyond the jazz grades', french: 'Cycle 3 (CEM)' },
	8: { abrsm: 'Beyond the jazz grades', french: 'DEM jazz' },
	9: { abrsm: 'Beyond the jazz grades', french: 'Higher education in jazz' },
	10: { abrsm: 'Beyond the jazz grades', french: 'Higher education in jazz' }
};

export type AnswerFormat = 'choice' | 'naming';

export interface TheoryLevel {
	maxAccidentals: number;
	parents: ParentScale[];
	answerFormat: AnswerFormat;
	progressions: ProgressionKind[];
	chords: number;
}

export const THEORY_LEVELS: Record<Level, TheoryLevel> = {
	1: {
		maxAccidentals: 1,
		parents: ['major'],
		answerFormat: 'choice',
		progressions: ['ii-v-i-major'],
		chords: 3
	},
	2: {
		maxAccidentals: 2,
		parents: ['major'],
		answerFormat: 'choice',
		progressions: ['ii-v-i-major'],
		chords: 3
	},
	3: {
		maxAccidentals: 3,
		parents: ['major', 'melodicMinor'],
		answerFormat: 'choice',
		progressions: ['ii-v-i-major', 'turnaround'],
		chords: 4
	},
	4: {
		maxAccidentals: 4,
		parents: ['major', 'melodicMinor'],
		answerFormat: 'choice',
		progressions: ['ii-v-i-major', 'turnaround'],
		chords: 4
	},
	5: {
		maxAccidentals: 4,
		parents: ['major', 'melodicMinor', 'harmonicMinor'],
		answerFormat: 'naming',
		progressions: ['ii-v-i-major', 'turnaround', 'modal-vamp'],
		chords: 4
	},
	6: {
		maxAccidentals: 5,
		parents: ['major', 'melodicMinor', 'harmonicMinor'],
		answerFormat: 'naming',
		progressions: ['ii-v-i-major', 'ii-v-i-minor', 'turnaround', 'modal-vamp'],
		chords: 4
	},
	7: {
		maxAccidentals: 6,
		parents: ['major', 'melodicMinor', 'harmonicMinor'],
		answerFormat: 'naming',
		progressions: ['ii-v-i-major', 'ii-v-i-minor', 'turnaround', 'modal-vamp'],
		chords: 4
	},
	8: {
		maxAccidentals: 6,
		parents: ['major', 'melodicMinor', 'harmonicMinor'],
		answerFormat: 'naming',
		progressions: ['ii-v-i-major', 'ii-v-i-minor', 'turnaround', 'modal-vamp', 'blues'],
		chords: 4
	},
	9: {
		maxAccidentals: 7,
		parents: ['major', 'melodicMinor', 'harmonicMinor'],
		answerFormat: 'naming',
		progressions: ['ii-v-i-major', 'ii-v-i-minor', 'turnaround', 'modal-vamp', 'blues'],
		chords: 4
	},
	10: {
		maxAccidentals: 7,
		parents: ['major', 'melodicMinor', 'harmonicMinor'],
		answerFormat: 'naming',
		progressions: ['ii-v-i-major', 'ii-v-i-minor', 'turnaround', 'modal-vamp', 'blues'],
		chords: 4
	}
};
