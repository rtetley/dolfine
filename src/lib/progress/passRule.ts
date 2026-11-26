/**
 * When a drill counts as passed: enough right answers among the last few. Theory and ear
 * training answer many short questions; a sight-reading run is long, so it counts as one answer
 * (passed or not) and its window is short.
 */

export interface PassRule {
	/** How many of the most recent answers are looked at. */
	window: number;
	/** How many of those must be right. */
	required: number;
}

export const UNLOCK_WINDOW = 20;
export const UNLOCK_ACCURACY = 0.9;
export const REQUIRED_CORRECT = Math.ceil(UNLOCK_WINDOW * UNLOCK_ACCURACY);

/** Theory and ear training: 18 right among the last 20 answers. */
export const ANSWER_RULE: PassRule = { window: UNLOCK_WINDOW, required: REQUIRED_CORRECT };

/** A sight-reading run passes with at least this share of right notes and of notes on time. */
export const RUN_PASS_PERCENT = 85;

/** Sight reading: 4 passing runs among the last 5. */
export const RUN_RULE: PassRule = { window: 5, required: 4 };

/** The tutorial level of sight reading, meant to be left quickly: 2 passing runs among 3. */
export const TUTORIAL_RULE: PassRule = { window: 3, required: 2 };

/** The longest window, which is how many recent answers each drill keeps. */
export const KEPT_ANSWERS = Math.max(ANSWER_RULE.window, RUN_RULE.window, TUTORIAL_RULE.window);
