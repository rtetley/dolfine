import { m } from '#lib/i18n.ts';
import type { Level } from '#lib/music/levels.ts';
import { pitchPool, readingContent } from '#lib/music/sightReadingLevels.ts';
import {
	bassLine,
	type Clef,
	generateMelody,
	type KeySignature,
	keyAccidentals,
	keyLabel,
	type MelodyNote,
	type MelodySettings,
	vexKeySignature
} from '#lib/music/melody.ts';
import { type Letter, type NoteNameSystem, toMidi } from '#lib/music/pitch.ts';
import { createRng, type Rng } from '#lib/music/random.ts';
import { isCompound, type Meter, measureTicks, TICKS_PER_QUARTER } from '#lib/music/rhythm.ts';
import type { ExpectedNote, ScoredNote } from '#lib/music/scoring.ts';
import type { NoteStyle, Score, ScoreNote, StaffClef, StaffPart } from '#lib/notation/model.ts';
import type { SightReadingPrefs } from './prefs';
import { STAFF_LABELS } from './prefs';

export interface ReadingNote extends ExpectedNote {
	letter: Letter;
}

export interface SightReadingExercise {
	seed: number;
	level: Level;
	key: KeySignature;
	meter: Meter;
	tempo: number;
	bars: number;
	parts: { clef: StaffClef; measures: MelodyNote[][] }[];
	expected: ReadingNote[];
	toleranceMs: number;
	/** The level's tempo, when spoken reading had to slow down so every name can be said. */
	slowedFrom: number | null;
	referenceIds: Set<string>;
	durationMs: number;
}

const REFERENCE_PITCHES: Record<Clef, readonly string[]> = {
	treble: ['G4', 'C4'],
	bass: ['F3', 'C4']
};

function parseMeter(text: string): Meter | null {
	const match = /^(\d+)\/(2|4|8)$/.exec(text);
	return match ? { beats: Number(match[1]), unit: Number(match[2]) as Meter['unit'] } : null;
}

function chooseKey(prefs: SightReadingPrefs, maxFifths: number, rng: Rng): KeySignature {
	const mode = prefs.keyMode === 'either' ? rng.pick(['major', 'minor'] as const) : prefs.keyMode;
	const fixed = Number(prefs.keyFifths);
	const fifths =
		prefs.keyFifths !== 'level' && Number.isInteger(fixed) ? fixed : rng.int(-maxFifths, maxFifths);
	return { fifths: Math.max(-7, Math.min(7, fifths)), mode };
}

export const msPerTick = (tempo: number): number => 60000 / tempo / TICKS_PER_QUARTER;

/** Nobody says more than about five clear names a second. */
export const MAX_SPOKEN_NAMES_PER_SECOND = 5;
/** Spoken onsets spread more than key presses, so the window never gets tighter than this. */
export const MIN_SPOKEN_TOLERANCE_MS = 80;

/** The shortest gap, in ticks, between two notes that must each be named. */
function shortestGap(measures: readonly MelodyNote[][], perMeasure: number): number {
	const onsets: number[] = [];
	measures.forEach((measure, m) => {
		let position = m * perMeasure;
		for (const note of measure) {
			if (note.pitch && !note.rest) onsets.push(position);
			position += note.ticks;
		}
	});
	let gap = Infinity;
	for (let i = 1; i < onsets.length; i++) gap = Math.min(gap, onsets[i] - onsets[i - 1]);
	return gap;
}

export function spokenTempo(tempo: number, gapTicks: number): number {
	const fastest = Math.floor(
		(gapTicks * 60000) / TICKS_PER_QUARTER / (1000 / MAX_SPOKEN_NAMES_PER_SECOND)
	);
	return Number.isFinite(fastest) ? Math.min(tempo, Math.max(fastest, 1)) : tempo;
}

export function createExercise(prefs: SightReadingPrefs, seed: number): SightReadingExercise {
	const rng = createRng(seed);
	const level = readingContent(prefs.level, prefs.exercise);
	// Triplets fill quarter-note beats: a compound meter chosen in setup can't hold them.
	const chosenMeter = parseMeter(prefs.meter);
	const tripletsOnly = level.uniform === 'triplets' || level.uniform === 'sixteenthTriplets';
	const meter =
		chosenMeter && !(tripletsOnly && isCompound(chosenMeter))
			? chosenMeter
			: rng.pick(level.meters);
	const key = chooseKey(prefs, level.maxFifths, rng);
	const spoken = prefs.input === 'voice';
	const chosenTempo = prefs.tempo > 0 ? prefs.tempo : level.tempo;
	const bars = prefs.bars > 0 ? prefs.bars : level.bars;
	const melodyClef: Clef = prefs.staff === 'bass' ? 'bass' : 'treble';
	const settings: MelodySettings = {
		key,
		meter,
		bars,
		clef: melodyClef,
		range: level.range,
		features: new Set(level.features),
		maxLeap: level.maxLeap,
		accidentalRate: level.accidentalRate,
		pool: level.pitches ? pitchPool(melodyClef, level.pitches) : undefined,
		moves: level.moves,
		uniform: level.uniform
	};
	const parts: SightReadingExercise['parts'] = [
		{ clef: melodyClef, measures: generateMelody(settings, rng) }
	];
	if (prefs.staff === 'grand' && !spoken) {
		parts.push({ clef: 'bass', measures: bassLine(settings, rng) });
	}

	const perMeasure = measureTicks(meter);
	const tempo = spoken
		? spokenTempo(chosenTempo, shortestGap(parts[0].measures, perMeasure))
		: chosenTempo;
	const tick = msPerTick(tempo);
	const expected: ReadingNote[] = [];
	const referenceIds = new Set<string>();
	parts.forEach((part, p) => {
		part.measures.forEach((measure, m) => {
			let position = m * perMeasure;
			measure.forEach((note, n) => {
				const id = noteId(p, m, n);
				if (note.pitch && !note.rest) {
					expected.push({
						id,
						midi: toMidi(note.pitch),
						letter: note.pitch.letter,
						time: position * tick
					});
					const label = `${note.pitch.letter}${note.pitch.octave}`;
					const clef = part.clef === 'bass' ? 'bass' : 'treble';
					if (note.pitch.accidental === 0 && REFERENCE_PITCHES[clef].includes(label))
						referenceIds.add(id);
				}
				position += note.ticks;
			});
		});
	});
	expected.sort((a, b) => a.time - b.time);

	return {
		seed,
		level: prefs.level,
		key,
		meter,
		tempo,
		bars,
		parts: parts.map((part) => ({ clef: part.clef, measures: part.measures })),
		expected,
		toleranceMs: spoken ? Math.max(level.toleranceMs, MIN_SPOKEN_TOLERANCE_MS) : level.toleranceMs,
		slowedFrom: tempo < chosenTempo ? chosenTempo : null,
		referenceIds,
		durationMs: bars * perMeasure * tick
	};
}

export const noteId = (part: number, measure: number, index: number): string =>
	`p${part}m${measure}n${index}`;

export function exerciseScore(
	exercise: SightReadingExercise,
	options: {
		showReferences: boolean;
		outcomes?: readonly ScoredNote[];
		/** Labels of what was heard in place of wrong notes, by note id. */
		heard?: ReadonlyMap<string, string>;
	}
): Score {
	const outcomeById = new Map(options.outcomes?.map((outcome) => [outcome.id, outcome.outcome]));
	const parts: StaffPart[] = exercise.parts.map((part, p) => ({
		clef: part.clef,
		measures: part.measures.map((measure, m) =>
			measure.map((note, n): ScoreNote => {
				const id = noteId(p, m, n);
				const outcome = outcomeById.get(id);
				const style: NoteStyle | undefined = outcome
					? outcome
					: options.showReferences && exercise.referenceIds.has(id)
						? 'reference'
						: undefined;
				return {
					id,
					ticks: note.ticks,
					rest: note.rest,
					pitches: note.pitch ? [note.pitch] : [],
					tie: note.tie,
					triplet: note.triplet,
					style,
					heard: options.heard?.get(id)
				};
			})
		)
	}));
	return {
		keySignature: vexKeySignature(exercise.key),
		keyAccidentals: keyAccidentals(exercise.key.fifths),
		meter: exercise.meter,
		parts
	};
}

export function exerciseSummary(
	exercise: SightReadingExercise,
	prefs: SightReadingPrefs,
	names: NoteNameSystem = 'letters',
	mode: SightReadingPrefs['mode'] = prefs.mode
): string {
	return m.sight_reading_summary({
		level: exercise.level,
		staff: STAFF_LABELS[prefs.staff],
		key: keyLabel(exercise.key, names),
		meter: `${exercise.meter.beats}/${exercise.meter.unit}`,
		tempo: exercise.tempo,
		mode: mode === 'performance' ? m.reading_performance() : m.practice_suffix()
	});
}

export function metronomeBeat(meter: Meter, tempo: number): { bpm: number; beatsPerBar: number } {
	return { bpm: (tempo * meter.unit) / 4, beatsPerBar: meter.beats };
}
