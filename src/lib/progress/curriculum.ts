import type { Level } from '#lib/music/levels.ts';
import type { SightReadingDrill } from '#lib/music/sightReadingLevels.ts';
import type { EarSubmodule } from '#lib/modules/ear/questions.ts';
import type { LessonId } from '#lib/modules/theory/lessons.ts';
import type { TheoryExercise } from '#lib/modules/theory/questions.ts';
import { ANSWER_RULE, type PassRule, RUN_RULE, TUTORIAL_RULE } from './passRule';

/**
 * What each level of the graded modules asks for. A level is a lesson to read and a handful
 * of exercises; the next level opens once every exercise of this one has its grade.
 *
 * A drill's `difficulty` is the level whose content settings generate its questions, so an
 * exercise met earlier comes back later with harder material (more accidentals, richer chords).
 */

export interface Drill<E extends string> {
	exercise: E;
	difficulty: Level;
	rule: PassRule;
}

export interface Stage<E extends string> {
	level: Level;
	lesson?: LessonId;
	drills: readonly Drill<E>[];
}

export type Curriculum<E extends string> = Record<Level, Stage<E>>;

const stage = <E extends string>(
	level: Level,
	lesson: LessonId | undefined,
	drills: readonly (E | readonly [E, Level])[],
	rule: PassRule = ANSWER_RULE
): Stage<E> => ({
	level,
	lesson,
	drills: drills.map((drill) =>
		typeof drill === 'string'
			? { exercise: drill, difficulty: level, rule }
			: { exercise: drill[0], difficulty: drill[1], rule }
	)
});

const MODES_FIRST = ['name-mode', 'write-mode'] as const;
const WITH_CHORDS = ['name-chord', 'build-chord', 'name-mode', 'write-mode'] as const;
const WITH_VOICING = [
	'voice-chord',
	'name-chord',
	'build-chord',
	'name-mode',
	'write-mode'
] as const;

/**
 * The major scale's part follows the colours curriculum: the harmonized scale (Level 1), the
 * association of chords and modes in twelve colours (Level 2), then the four colours that
 * complete the modes (Level 3). The voicings lesson comes back with the melodic minor.
 */
export const THEORY_CURRICULUM: Curriculum<TheoryExercise> = {
	1: stage(1, 'major', MODES_FIRST),
	2: stage(2, 'chord-colours', WITH_CHORDS),
	3: stage(3, 'four-colours', WITH_VOICING),
	4: stage(4, 'melodic-minor', MODES_FIRST),
	5: stage(5, 'voicings', WITH_CHORDS),
	6: stage(6, 'voicings', WITH_VOICING),
	7: stage(7, undefined, [
		'name-mode',
		'name-chord',
		'voice-chord',
		'mode-in-context',
		'voice-leading'
	]),
	8: stage(8, 'harmonic-minor', MODES_FIRST),
	9: stage(9, 'voicings', WITH_CHORDS),
	10: stage(10, undefined, ['voice-chord', 'name-chord', 'mode-in-context', 'voice-leading'])
};

/**
 * Chord colours come in at every level, a few at a time (see `COLOUR_SETS`): a drill's
 * difficulty is the step of that progression, from Δ9 against 6/9 to all sixteen colours.
 */
export const EAR_CURRICULUM: Curriculum<EarSubmodule> = {
	1: stage(1, 'chord-colours', ['intervals', 'chords', 'colours']),
	2: stage(2, 'major', [['modes', 1], 'intervals', 'chords', 'colours']),
	3: stage(3, 'chord-colours', [['voicings', 1], 'intervals', 'chords', 'colours']),
	4: stage(4, 'major', [['progressions', 2], ['modes', 2], ['voicings', 3], 'colours']),
	5: stage(5, 'melodic-minor', [['modes', 3], ['chords', 4], 'intervals', 'colours']),
	6: stage(6, 'voicings', [['voicings', 4], ['progressions', 4], ['chords', 5], 'colours']),
	7: stage(7, 'chord-colours', [
		['modes', 4],
		['voicings', 6],
		['chords', 6],
		'intervals',
		'colours'
	]),
	8: stage(8, 'harmonic-minor', [['modes', 6], ['progressions', 6], ['chords', 7], 'colours']),
	9: stage(9, 'four-colours', [
		['voicings', 8],
		['progressions', 8],
		['chords', 8],
		'intervals',
		'colours'
	]),
	10: stage(10, undefined, ['modes', 'voicings', 'progressions', 'chords', 'intervals', 'colours'])
};

/**
 * Each sight-reading level's drills, as in the level table (a test keeps them the same; they are
 * repeated so pages can read progress without loading the generators). A run counts as one answer.
 */
const FOCUS_AND_REVIEW = ['focus', 'review'] as const;
export const SIGHT_READING_CURRICULUM: Curriculum<SightReadingDrill> = {
	1: stage(1, undefined, ['focus'], TUTORIAL_RULE),
	2: stage(2, undefined, FOCUS_AND_REVIEW, RUN_RULE),
	3: stage(3, undefined, FOCUS_AND_REVIEW, RUN_RULE),
	4: stage(4, undefined, FOCUS_AND_REVIEW, RUN_RULE),
	5: stage(5, undefined, FOCUS_AND_REVIEW, RUN_RULE),
	6: stage(6, undefined, FOCUS_AND_REVIEW, RUN_RULE),
	7: stage(7, undefined, FOCUS_AND_REVIEW, RUN_RULE),
	8: stage(8, undefined, FOCUS_AND_REVIEW, RUN_RULE),
	9: stage(9, undefined, ['dotted', 'syncopation', 'compound', 'review'], RUN_RULE),
	10: stage(10, undefined, ['review'], RUN_RULE)
};

export type GradedModule = 'theory' | 'ear' | 'sight-reading';

/** The ear sub-modules, repeated here (type-checked) so pages can read progress without loading the generators. */
export const EAR_SUBMODULES_GRADED = [
	'intervals',
	'chords',
	'voicings',
	'modes',
	'progressions',
	'colours'
] as const satisfies readonly EarSubmodule[];

export const CURRICULA: {
	theory: Curriculum<TheoryExercise>;
	ear: Curriculum<EarSubmodule>;
	'sight-reading': Curriculum<SightReadingDrill>;
} = {
	theory: THEORY_CURRICULUM,
	ear: EAR_CURRICULUM,
	'sight-reading': SIGHT_READING_CURRICULUM
};

/** The exercises graded at a level, as the keys their records are saved under. */
export const exercisesAt = (module: GradedModule, level: Level): readonly string[] =>
	drillsOf(module, level).map((drill) => drill.exercise);

/** The pass rule of one drill (the default rule if the level doesn't grade it). */
export const ruleFor = (module: GradedModule, level: Level, exercise: string): PassRule =>
	drillsOf(module, level).find((drill) => drill.exercise === exercise)?.rule ?? ANSWER_RULE;

/** Sight reading counts runs, the other modules answers. */
export const countsRuns = (module: GradedModule): boolean => module === 'sight-reading';

/** The drills graded at a level, with their pass rules. */
export const drillsOf = (
	module: GradedModule,
	level: Level
): readonly { exercise: string; rule: PassRule }[] => CURRICULA[module][level].drills;

export const findDrill = <E extends string>(
	curriculum: Curriculum<E>,
	level: Level,
	exercise: string
): Drill<E> | undefined => curriculum[level].drills.find((drill) => drill.exercise === exercise);

export interface DrillChoice<E extends string> {
	level: Level;
	exercise: E;
}

/**
 * Where to open a module from a saved choice: the same exercise if that level is still open
 * and grades it, else the first exercise of the highest level allowed.
 */
export function openDrill<E extends string>(
	curriculum: Curriculum<E>,
	saved: { level: Level; exercise: string },
	unlocked: Level
): DrillChoice<E> {
	const level = saved.level > unlocked ? unlocked : saved.level;
	const drill = findDrill(curriculum, level, saved.exercise) ?? curriculum[level].drills[0];
	return { level, exercise: drill.exercise };
}
