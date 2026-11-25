import { m } from '#lib/i18n.ts';
import type { ProgressionKind } from './progressions';
import type { ParentScale } from './scales';

export const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;
export type Level = (typeof LEVELS)[number];

export interface ExamEquivalent {
	readonly abrsm: string;
	readonly french: string;
}

const equivalent = (abrsm: () => string, french: () => string): ExamEquivalent => ({
	get abrsm() {
		return abrsm();
	},
	get french() {
		return french();
	}
});

const literal = (text: string) => (): string => text;
const grade = (value: number) => (): string => m.exam_grade({ grade: value });
const jazzGrade = (value: number) => (): string => m.exam_jazz_grade({ grade: value });

export const CLASSICAL_MAPPING: Record<Level, ExamEquivalent> = {
	1: equivalent(grade(3), m.cycle_2_start),
	2: equivalent(grade(4), m.cycle_2),
	3: equivalent(grade(5), m.cycle_2_end_bem),
	4: equivalent(grade(6), m.cycle_3_start),
	5: equivalent(grade(7), m.cycle_3),
	6: equivalent(grade(8), m.cycle_3_end_cem),
	7: equivalent(literal('ARSM'), literal('DEM / CPES')),
	8: equivalent(literal('DipABRSM'), m.higher_education_entrance),
	9: equivalent(literal('LRSM'), m.higher_education_dnspm),
	10: equivalent(literal('FRSM'), m.professional_level)
};

export const JAZZ_MAPPING: Record<Level, ExamEquivalent> = {
	1: equivalent(jazzGrade(1), m.cycle_1),
	2: equivalent(jazzGrade(2), m.cycle_1),
	3: equivalent(jazzGrade(3), m.cycle_2),
	4: equivalent(jazzGrade(4), m.cycle_2),
	5: equivalent(jazzGrade(5), m.cycle_2_end),
	6: equivalent(m.exam_beyond_jazz_grades, m.cycle_3_cem),
	7: equivalent(m.exam_beyond_jazz_grades, m.cycle_3_cem),
	8: equivalent(m.exam_beyond_jazz_grades, literal('DEM jazz')),
	9: equivalent(m.exam_beyond_jazz_grades, m.higher_education_jazz),
	10: equivalent(m.exam_beyond_jazz_grades, m.higher_education_jazz)
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
