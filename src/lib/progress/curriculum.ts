import type { Level } from '#lib/music/levels.ts';
import type { EarSubmodule } from '#lib/modules/ear/questions.ts';
import type { LessonId } from '#lib/modules/theory/lessons.ts';
import type { TheoryExercise } from '#lib/modules/theory/questions.ts';

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
	drills: readonly (E | readonly [E, Level])[]
): Stage<E> => ({
	level,
	lesson,
	drills: drills.map((drill) =>
		typeof drill === 'string'
			? { exercise: drill, difficulty: level }
			: { exercise: drill[0], difficulty: drill[1] }
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

export const THEORY_CURRICULUM: Curriculum<TheoryExercise> = {
	1: stage(1, 'major', MODES_FIRST),
	2: stage(2, 'voicings', WITH_CHORDS),
	3: stage(3, 'voicings', WITH_VOICING),
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

export const EAR_CURRICULUM: Curriculum<EarSubmodule> = {
	1: stage(1, undefined, ['intervals', 'chords']),
	2: stage(2, 'major', [['modes', 1], 'intervals', 'chords']),
	3: stage(3, 'voicings', [['voicings', 1], 'intervals', 'chords']),
	4: stage(4, 'major', [
		['progressions', 2],
		['modes', 2],
		['voicings', 3]
	]),
	5: stage(5, 'melodic-minor', [['modes', 3], ['chords', 4], 'intervals']),
	6: stage(6, 'voicings', [
		['voicings', 4],
		['progressions', 4],
		['chords', 5]
	]),
	7: stage(7, undefined, [['modes', 4], ['voicings', 6], ['chords', 6], 'intervals']),
	8: stage(8, 'harmonic-minor', [
		['modes', 6],
		['progressions', 6],
		['chords', 7]
	]),
	9: stage(9, 'voicings', [['voicings', 8], ['progressions', 8], ['chords', 8], 'intervals']),
	10: stage(10, undefined, ['modes', 'voicings', 'progressions', 'chords', 'intervals'])
};

export type GradedModule = 'theory' | 'ear';

/** The ear sub-modules, repeated here (type-checked) so pages can read progress without loading the generators. */
export const EAR_SUBMODULES_GRADED = [
	'intervals',
	'chords',
	'voicings',
	'modes',
	'progressions'
] as const satisfies readonly EarSubmodule[];

export const CURRICULA: { theory: Curriculum<TheoryExercise>; ear: Curriculum<EarSubmodule> } = {
	theory: THEORY_CURRICULUM,
	ear: EAR_CURRICULUM
};

/** The exercises graded at a level, as the keys their records are saved under. */
export const exercisesAt = (module: GradedModule, level: Level): readonly string[] =>
	CURRICULA[module][level].drills.map((drill) => drill.exercise);

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
