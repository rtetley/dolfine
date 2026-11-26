import { m } from '#lib/i18n.ts';
import type { TheoryExercise } from './questions';

/** The exercises' names, apart from their generators so lesson pages can list them cheaply. */
export const THEORY_EXERCISE_LABELS: Record<TheoryExercise, string> = {
	get 'name-mode'() {
		return m.theory_exercise_name_mode();
	},
	get 'write-mode'() {
		return m.theory_exercise_write_mode();
	},
	get 'mode-in-context'() {
		return m.theory_exercise_mode_in_context();
	},
	get 'name-chord'() {
		return m.theory_exercise_name_chord();
	},
	get 'build-chord'() {
		return m.theory_exercise_build_chord();
	},
	get 'voice-chord'() {
		return m.theory_exercise_voice_chord();
	},
	get 'voice-leading'() {
		return m.theory_exercise_voice_leading();
	}
};
