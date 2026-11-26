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

const MAJOR_TURNAROUND: ProgressionKind[] = ['ii-v-i-major', 'turnaround'];
const ALL_PROGRESSIONS: ProgressionKind[] = [
	'ii-v-i-major',
	'ii-v-i-minor',
	'turnaround',
	'modal-vamp',
	'blues'
];

const theoryLevel = (
	parents: ParentScale[],
	maxAccidentals: number,
	answerFormat: AnswerFormat,
	progressions: ProgressionKind[] = ['ii-v-i-major'],
	chords = 3
): TheoryLevel => ({ parents, maxAccidentals, answerFormat, progressions, chords });

/**
 * Content settings for each theory level, following the curriculum: the major scale
 * (levels 1–3), melodic minor (4–6), both together (7), harmonic minor (8–9), all three (10).
 * Within a scale, each level widens the keys used.
 */
export const THEORY_LEVELS: Record<Level, TheoryLevel> = {
	1: theoryLevel(['major'], 1, 'choice'),
	2: theoryLevel(['major'], 3, 'choice'),
	// The end of the major scale's part: every mode named and written in all twelve keys.
	3: theoryLevel(['major'], 6, 'choice'),
	4: theoryLevel(['melodicMinor'], 1, 'choice'),
	5: theoryLevel(['melodicMinor'], 3, 'choice'),
	6: theoryLevel(['melodicMinor'], 5, 'naming'),
	7: theoryLevel(['major', 'melodicMinor'], 6, 'naming', [...MAJOR_TURNAROUND, 'modal-vamp'], 4),
	8: theoryLevel(['harmonicMinor'], 2, 'naming'),
	9: theoryLevel(['harmonicMinor'], 4, 'naming'),
	10: theoryLevel(['major', 'melodicMinor', 'harmonicMinor'], 7, 'naming', ALL_PROGRESSIONS, 4)
};

export interface EarScaleLevel {
	parents: ParentScale[];
	progressions: ProgressionKind[];
}

/** The parent scales and progressions heard at each ear-training difficulty. */
export function earScaleLevel(level: Level): EarScaleLevel {
	const parents: ParentScale[] =
		level <= 2
			? ['major']
			: level <= 4
				? ['major', 'melodicMinor']
				: ['major', 'melodicMinor', 'harmonicMinor'];
	const progressions =
		level <= 2
			? ['ii-v-i-major' as const]
			: level <= 4
				? MAJOR_TURNAROUND
				: ALL_PROGRESSIONS.filter(
						(kind) => (kind !== 'ii-v-i-minor' || level >= 6) && (kind !== 'blues' || level >= 8)
					);
	return { parents, progressions };
}
