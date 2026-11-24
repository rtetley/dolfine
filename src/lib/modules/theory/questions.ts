import { type ChordRef, chordSymbol, chordTone, seventhChordTones } from '#lib/music/chords.ts';
import { type Level, THEORY_LEVELS } from '#lib/music/levels.ts';
import { mod, type Pitch, type PitchClassName, pitchClassOf } from '#lib/music/pitch.ts';
import {
	buildProgression,
	type Progression,
	type ProgressionKind
} from '#lib/music/progressions.ts';
import { createRng, type Rng } from '#lib/music/random.ts';
import {
	degreeRoot,
	MODES,
	type ModeId,
	modeInfo,
	modeScale,
	type ParentScale,
	parentRootOf
} from '#lib/music/scales.ts';
import { solveWithAlternation, type SheetEntry } from '#lib/music/voiceLeading.ts';
import type { Voicing, VoicingType } from '#lib/music/voicings.ts';

export const THEORY_EXERCISES = [
	'name-mode',
	'write-mode',
	'mode-in-context',
	'name-chord',
	'build-chord',
	'voice-chord',
	'voice-leading'
] as const;
export type TheoryExercise = (typeof THEORY_EXERCISES)[number];

export const THEORY_EXERCISE_LABELS: Record<TheoryExercise, string> = {
	'name-mode': 'Name the mode',
	'write-mode': 'Write the mode',
	'mode-in-context': 'Mode in context',
	'name-chord': 'Name the chord',
	'build-chord': 'Build the chord',
	'voice-chord': 'Voice the chord',
	'voice-leading': 'Voice-leading sheet'
};

export interface TheoryPrefs extends Record<string, unknown> {
	level: Level;
	exercise: TheoryExercise;
	parent: ParentScale | 'level';
	answerFormat: 'level' | 'choice' | 'naming';
	voicingType: VoicingType | 'alternate';
}

export const THEORY_DEFAULTS: TheoryPrefs = {
	level: 1,
	exercise: 'name-mode',
	parent: 'level',
	answerFormat: 'level',
	voicingType: 'alternate'
};

const ROOTS_BY_ACCIDENTALS: readonly (readonly [PitchClassName, number])[] = [
	[{ letter: 'C', accidental: 0 }, 0],
	[{ letter: 'G', accidental: 0 }, 1],
	[{ letter: 'F', accidental: 0 }, 1],
	[{ letter: 'D', accidental: 0 }, 2],
	[{ letter: 'B', accidental: -1 }, 2],
	[{ letter: 'A', accidental: 0 }, 3],
	[{ letter: 'E', accidental: -1 }, 3],
	[{ letter: 'E', accidental: 0 }, 4],
	[{ letter: 'A', accidental: -1 }, 4],
	[{ letter: 'B', accidental: 0 }, 5],
	[{ letter: 'D', accidental: -1 }, 5],
	[{ letter: 'F', accidental: 1 }, 6],
	[{ letter: 'G', accidental: -1 }, 6],
	[{ letter: 'C', accidental: 1 }, 7]
];

export function pickParentRoot(rng: Rng, maxAccidentals: number): PitchClassName {
	return rng.pick(
		ROOTS_BY_ACCIDENTALS.filter(([, count]) => count <= maxAccidentals).map(([root]) => root)
	);
}

export const answerFormatFor = (prefs: TheoryPrefs): 'choice' | 'naming' =>
	prefs.answerFormat === 'level' ? THEORY_LEVELS[prefs.level].answerFormat : prefs.answerFormat;

const parentsFor = (prefs: TheoryPrefs): ParentScale[] =>
	prefs.parent === 'level' ? THEORY_LEVELS[prefs.level].parents : [prefs.parent];

export interface ParentChoice {
	root: number | null;
	parent: ParentScale | null;
}

export interface ModeQuestion {
	kind: 'name-mode' | 'write-mode';
	mode: ModeId;
	modeRoot: PitchClassName;
	parentRoot: PitchClassName;
	notes: Pitch[];
	options: ModeId[];
}

export interface ContextQuestion {
	kind: 'mode-in-context';
	progression: Progression;
	index: number;
	options: ModeId[];
}

export interface ChordQuestion {
	kind: 'name-chord' | 'build-chord' | 'voice-chord';
	chord: ChordRef;
	parentRoot: PitchClassName;
	type: VoicingType;
	options: string[];
}

export interface SheetQuestion {
	kind: 'voice-leading';
	progression: Progression;
	entries: SheetEntry[];
	model: Voicing[];
}

export type TheoryQuestion = ModeQuestion | ContextQuestion | ChordQuestion | SheetQuestion;

function modeOptions(correct: ModeId, pool: readonly ModeId[], rng: Rng, count = 4): ModeId[] {
	const distractors = rng.shuffle(pool.filter((id) => id !== correct)).slice(0, count - 1);
	return rng.shuffle([correct, ...distractors]);
}

function sameFamily(mode: ModeId): ModeId[] {
	const suffix = modeInfo(mode).chordSuffix;
	const family = suffix.startsWith('-')
		? '-'
		: suffix.startsWith('7')
			? '7'
			: suffix.startsWith('Δ')
				? 'Δ'
				: 'other';
	return MODES.filter((m) => {
		const s = m.chordSuffix;
		const f = s.startsWith('-') ? '-' : s.startsWith('7') ? '7' : s.startsWith('Δ') ? 'Δ' : 'other';
		return f === family;
	}).map((m) => m.id);
}

export function createQuestion(prefs: TheoryPrefs, seed: number): TheoryQuestion {
	const rng = createRng(seed);
	const level = THEORY_LEVELS[prefs.level];
	const parents = parentsFor(prefs);
	const parent = rng.pick(parents);
	const parentRoot = pickParentRoot(rng, level.maxAccidentals);
	const degree = rng.pick([1, 2, 3, 4, 5, 6, 7] as const);
	const mode = modeInfo(`${parent}:${degree}`).id;
	const modeRoot = degreeRoot(parent, degree, parentRoot);
	const pool = MODES.filter((m) => parents.includes(m.parent)).map((m) => m.id);

	switch (prefs.exercise) {
		case 'name-mode':
		case 'write-mode':
			return {
				kind: prefs.exercise,
				mode,
				modeRoot,
				parentRoot,
				notes: modeScale(mode, { ...modeRoot, octave: 4 }),
				options: modeOptions(mode, pool, rng)
			};
		case 'mode-in-context': {
			const kind = rng.pick<ProgressionKind>(level.progressions);
			const progression = buildProgression(kind, parentRoot, rng);
			const index = rng.int(0, progression.chords.length - 1);
			const target = (progression.chords[index] as ChordRef).mode;
			return {
				kind: 'mode-in-context',
				progression,
				index,
				options: modeOptions(target, sameFamily(target), rng)
			};
		}
		case 'name-chord':
		case 'build-chord':
		case 'voice-chord': {
			const chord: ChordRef = { root: modeRoot, mode };
			const type: VoicingType =
				prefs.voicingType === 'alternate' ? rng.pick(['A', 'B'] as const) : prefs.voicingType;
			const symbols = [...new Set(MODES.map((m) => chordSymbol({ root: modeRoot, mode: m.id })))];
			const correct = chordSymbol(chord);
			const options = rng.shuffle([
				correct,
				...rng.shuffle(symbols.filter((s) => s !== correct)).slice(0, 3)
			]);
			return { kind: prefs.exercise, chord, parentRoot, type, options };
		}
		case 'voice-leading':
			return createSheetQuestion(prefs, rng);
	}
}

function createSheetQuestion(prefs: TheoryPrefs, rng: Rng): SheetQuestion {
	const level = THEORY_LEVELS[prefs.level];
	for (let attempt = 0; attempt < 40; attempt++) {
		const kind = rng.pick<ProgressionKind>(level.progressions);
		const key = pickParentRoot(rng, level.maxAccidentals);
		const progression = buildProgression(kind, key, rng);
		const chords = progression.chords.slice(0, Math.max(3, level.chords));
		const solved = solveWithAlternation(chords);
		if (solved) {
			return {
				kind: 'voice-leading',
				progression: { ...progression, chords: progression.chords.slice(0, chords.length) },
				entries: solved.entries,
				model: solved.voicings
			};
		}
	}
	const fallback = buildProgression('ii-v-i-major', { letter: 'C', accidental: 0 }, rng);
	const solved = solveWithAlternation(fallback.chords);
	if (!solved) throw new Error('The II–V–I fallback must always be solvable');
	return {
		kind: 'voice-leading',
		progression: fallback,
		entries: solved.entries,
		model: solved.voicings
	};
}

export const parentOf = (
	mode: ModeId,
	modeRoot: PitchClassName
): { parent: ParentScale; root: PitchClassName } => ({
	parent: modeInfo(mode).parent,
	root: parentRootOf(mode, modeRoot)
});

export function checkParentAnswer(
	question: ModeQuestion,
	parent: ParentScale,
	rootPc: number
): boolean {
	const expected = parentOf(question.mode, question.modeRoot);
	return expected.parent === parent && pitchClassOf(expected.root) === rootPc;
}

export interface NoteCheck {
	midi: number;
	ok: boolean;
}

export function checkWrittenScale(
	question: ModeQuestion,
	midis: readonly number[]
): { ok: boolean; notes: NoteCheck[] } {
	const sorted = [...new Set(midis)].sort((a, b) => a - b);
	const expected = question.notes.map(pitchClassOf);
	const notes = sorted.map((midi, i) => ({ midi, ok: mod(midi, 12) === expected[i] }));
	const span = sorted.length > 0 ? (sorted.at(-1) as number) - sorted[0] : 0;
	return { ok: notes.length === 7 && notes.every((n) => n.ok) && span < 12, notes };
}

export function chordPitchClasses(chord: ChordRef): number[] {
	return seventhChordTones(chord).map((tone) => pitchClassOf(tone.name));
}

export function checkBuiltChord(
	chord: ChordRef,
	midis: readonly number[]
): { ok: boolean; notes: NoteCheck[] } {
	const expected = new Set(chordPitchClasses(chord));
	const unique = [...new Set(midis)].sort((a, b) => a - b);
	const notes = unique.map((midi) => ({ midi, ok: expected.has(mod(midi, 12)) }));
	const covered = new Set(unique.map((midi) => mod(midi, 12)));
	return { ok: notes.every((n) => n.ok) && [...expected].every((pc) => covered.has(pc)), notes };
}

export const chordToneNames = (chord: ChordRef): PitchClassName[] =>
	([1, 3, 4, 5, 7, 9, 11, 13, 'sharp9'] as const).map((token) => chordTone(chord, token).name);
