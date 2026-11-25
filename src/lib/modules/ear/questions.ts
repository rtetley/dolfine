import { m } from '#lib/i18n.ts';
import { type ChordRef, chordSymbol } from '#lib/music/chords.ts';
import {
	EAR_VOICINGS_BY_LEVEL,
	type EarChordQuality,
	earChordsForLevel,
	type EarVoicing,
	intervalName,
	INTERVALS_BY_LEVEL,
	voiceEarChord
} from '#lib/music/earChords.ts';
import { type Level, THEORY_LEVELS } from '#lib/music/levels.ts';
import { mod, toMidi } from '#lib/music/pitch.ts';
import {
	buildProgression,
	type Progression,
	type ProgressionKind
} from '#lib/music/progressions.ts';
import { createRng, type Rng } from '#lib/music/random.ts';
import { degreeRoot, MODES, type ModeId, modeInfo, modeScale } from '#lib/music/scales.ts';
import { solveWithAlternation } from '#lib/music/voiceLeading.ts';
import { defaultVoicing, type VoicingType } from '#lib/music/voicings.ts';
import { pickParentRoot } from '#lib/modules/theory/questions.ts';

export const EAR_SUBMODULES = ['intervals', 'chords', 'voicings', 'modes', 'progressions'] as const;
export type EarSubmodule = (typeof EAR_SUBMODULES)[number];

export const EAR_SUBMODULE_LABELS: Record<EarSubmodule, string> = {
	get intervals() {
		return m.ear_submodule_intervals();
	},
	get chords() {
		return m.ear_submodule_chords();
	},
	get voicings() {
		return m.ear_submodule_voicings();
	},
	get modes() {
		return m.ear_submodule_modes();
	},
	get progressions() {
		return m.ear_submodule_progressions();
	}
};

export type EarAnswerFormat = 'level' | 'choice' | 'naming' | 'play';

export interface EarPrefs extends Record<string, unknown> {
	level: Level;
	submodule: EarSubmodule;
	answerFormat: EarAnswerFormat;
	voicing: EarVoicing | 'level';
}

export const EAR_DEFAULTS: EarPrefs = {
	level: 1,
	submodule: 'chords',
	answerFormat: 'level',
	voicing: 'level'
};

export interface Option {
	id: string;
	label: string;
}

export interface IntervalQuestion {
	kind: 'intervals';
	notes: [number, number];
	harmonic: boolean;
	answer: string;
	options: Option[];
}

export interface ChordEarQuestion {
	kind: 'chords';
	root: number;
	midis: number[];
	quality: EarChordQuality;
	voicing: EarVoicing;
	answer: string;
	options: Option[];
}

export interface VoicingEarQuestion {
	kind: 'voicings';
	ask: 'top-note' | 'type';
	root: number;
	midis: number[];
	chordLabel: string;
	answer: string;
	options: Option[];
}

export interface ModeEarQuestion {
	kind: 'modes';
	root: number;
	scale: number[];
	mode: ModeId;
	options: ModeId[];
}

export interface ProgressionEarQuestion {
	kind: 'progressions';
	progression: Progression;
	voicings: number[][];
	tonic: number[];
	ask: 'degrees' | 'symbols';
	answers: string[];
	options: string[];
}

export type EarQuestion =
	| IntervalQuestion
	| ChordEarQuestion
	| VoicingEarQuestion
	| ModeEarQuestion
	| ProgressionEarQuestion;

const topNoteNames = (): string[] => [
	m.top_note_root(),
	'♭9',
	'9',
	'♯9 / ♭3',
	'3',
	'11',
	'♯11 / ♭5',
	'5',
	'♭13 / ♯5',
	'13',
	'♭7',
	'7'
];

const pickOptions = (correct: Option, pool: readonly Option[], rng: Rng, count: number): Option[] =>
	rng.shuffle([
		correct,
		...rng.shuffle(pool.filter((o) => o.id !== correct.id)).slice(0, count - 1)
	]);

export function createEarQuestion(prefs: EarPrefs, seed: number): EarQuestion {
	const rng = createRng(seed);
	switch (prefs.submodule) {
		case 'intervals':
			return intervalQuestion(prefs.level, rng);
		case 'chords':
			return chordQuestion(prefs, rng);
		case 'voicings':
			return voicingQuestion(prefs, rng);
		case 'modes':
			return modeQuestion(prefs.level, rng);
		case 'progressions':
			return progressionQuestion(prefs.level, rng);
	}
}

function intervalQuestion(level: Level, rng: Rng): IntervalQuestion {
	const semitones = rng.pick(INTERVALS_BY_LEVEL[level]);
	const low = rng.int(55, 67);
	const down = rng.chance(0.3);
	const harmonic = level >= 3 && rng.chance(0.3);
	const notes: [number, number] =
		down && !harmonic ? [low + semitones, low] : [low, low + semitones];
	const all = INTERVALS_BY_LEVEL[level].map((s) => ({
		id: String(s),
		label: intervalName(s)
	}));
	const correct = { id: String(semitones), label: intervalName(semitones) };
	return {
		kind: 'intervals',
		notes,
		harmonic,
		answer: correct.id,
		options: pickOptions(correct, all, rng, Math.min(5, all.length))
	};
}

function chordQuestion(prefs: EarPrefs, rng: Rng): ChordEarQuestion {
	const qualities = earChordsForLevel(prefs.level);
	const quality = rng.pick(qualities);
	const voicing =
		prefs.voicing === 'level' ? rng.pick(EAR_VOICINGS_BY_LEVEL[prefs.level]) : prefs.voicing;
	const root = rng.int(45, 52);
	const options = qualities.map((q) => ({ id: q.id, label: q.symbol }));
	return {
		kind: 'chords',
		root,
		midis: voiceEarChord(root, quality, voicing),
		quality,
		voicing,
		answer: quality.id,
		options: pickOptions(
			{ id: quality.id, label: quality.symbol },
			options,
			rng,
			Math.min(6, options.length)
		)
	};
}

function voicingQuestion(prefs: EarPrefs, rng: Rng): VoicingEarQuestion {
	if (prefs.level <= 4 || rng.chance(0.4)) {
		const mode = rng.pick(
			MODES.filter((m) => THEORY_LEVELS[prefs.level].parents.includes(m.parent))
		).id;
		const chord: ChordRef = { root: pickParentRoot(rng, 3), mode };
		const type: VoicingType = rng.pick(['A', 'B'] as const);
		const voicing = defaultVoicing(chord, type);
		const root = voicing.midis[0] ?? 48;
		return {
			kind: 'voicings',
			ask: 'type',
			root,
			midis: voicing.midis,
			chordLabel: chordSymbol(chord),
			answer: type,
			options: [
				{ id: 'A', label: 'Type A · 1 7 / 3 5 9' },
				{ id: 'B', label: 'Type B · 1 3 7 / 9 5' }
			]
		};
	}
	const quality = rng.pick(earChordsForLevel(prefs.level));
	const voicing =
		prefs.voicing === 'level' ? rng.pick(EAR_VOICINGS_BY_LEVEL[prefs.level]) : prefs.voicing;
	const root = rng.int(45, 52);
	const midis = voiceEarChord(root, quality, voicing);
	const top = mod((midis.at(-1) ?? root) - root, 12);
	const names = topNoteNames();
	const options = names.map((label, i) => ({ id: String(i), label }));
	return {
		kind: 'voicings',
		ask: 'top-note',
		root,
		midis,
		chordLabel: quality.symbol,
		answer: String(top),
		options: pickOptions({ id: String(top), label: names[top] ?? '' }, options, rng, 5)
	};
}

function modeQuestion(level: Level, rng: Rng): ModeEarQuestion {
	const parents = THEORY_LEVELS[level].parents;
	const pool = MODES.filter((m) => parents.includes(m.parent)).map((m) => m.id);
	const mode = rng.pick(pool);
	const info = modeInfo(mode);
	const parentRoot = pickParentRoot(rng, 4);
	const modeRoot = degreeRoot(info.parent, info.degree, parentRoot);
	const scale = modeScale(mode, { ...modeRoot, octave: 4 }).map(toMidi);
	const root = scale[0] ?? 60;
	return {
		kind: 'modes',
		root,
		scale: [...scale, root + 12],
		mode,
		options: rng.shuffle([mode, ...rng.shuffle(pool.filter((m) => m !== mode)).slice(0, 3)])
	};
}

function progressionQuestion(level: Level, rng: Rng): ProgressionEarQuestion {
	const kinds = THEORY_LEVELS[level].progressions.filter(
		(k): k is ProgressionKind => k !== 'blues'
	);
	const kind = rng.pick(kinds.length > 0 ? kinds : (['ii-v-i-major'] as ProgressionKind[]));
	const progression = buildProgression(kind, pickParentRoot(rng, 3), rng);
	const solved = solveWithAlternation(progression.chords);
	const voicings = solved
		? solved.voicings.map((v) => v.midis)
		: progression.chords.map((chord, i) => defaultVoicing(chord, i % 2 === 0 ? 'A' : 'B').midis);
	const tonicChord =
		progression.chords.find(
			(c) => c.roman.startsWith('I') && !c.roman.startsWith('II') && !c.roman.startsWith('IV')
		) ?? progression.chords[0];
	const tonic = tonicChord ? defaultVoicing(tonicChord, 'A').midis : [];
	const ask = level <= 6 ? 'degrees' : 'symbols';
	const answers = progression.chords.map((chord) =>
		ask === 'degrees' ? chord.roman : chordSymbol(chord)
	);
	const extra =
		ask === 'degrees'
			? ['IΔ7', 'II-7', 'III-7', 'IVΔ7', 'V7', 'VI-7', 'VIIø7', 'IIø7', 'I-Δ7']
			: progression.chords.map((c) => chordSymbol({ ...c, mode: rng.pick(MODES).id }));
	return {
		kind: 'progressions',
		progression,
		voicings,
		tonic,
		ask,
		answers,
		options: [...new Set([...answers, ...extra])].sort()
	};
}

export const earFormatFor = (prefs: EarPrefs): 'choice' | 'naming' | 'play' =>
	prefs.answerFormat === 'level' ? (prefs.level <= 4 ? 'choice' : 'naming') : prefs.answerFormat;

export function samePitchClasses(a: readonly number[], b: readonly number[]): boolean {
	const left = new Set(a.map((m) => mod(m, 12)));
	const right = new Set(b.map((m) => mod(m, 12)));
	return left.size === right.size && [...left].every((pc) => right.has(pc));
}
