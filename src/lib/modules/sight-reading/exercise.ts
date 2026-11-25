import { m } from '#lib/i18n.ts';
import type { Level } from '#lib/music/levels.ts';
import { SIGHT_READING_LEVELS } from '#lib/music/sightReadingLevels.ts';
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
import { type NoteNameSystem, toMidi } from '#lib/music/pitch.ts';
import { createRng, type Rng } from '#lib/music/random.ts';
import { type Meter, measureTicks, TICKS_PER_QUARTER } from '#lib/music/rhythm.ts';
import type { ExpectedNote, ScoredNote } from '#lib/music/scoring.ts';
import type { NoteStyle, Score, ScoreNote, StaffClef, StaffPart } from '#lib/notation/model.ts';
import type { SightReadingPrefs } from './prefs';
import { STAFF_LABELS } from './prefs';

export interface SightReadingExercise {
	seed: number;
	level: Level;
	key: KeySignature;
	meter: Meter;
	tempo: number;
	bars: number;
	parts: { clef: StaffClef; measures: MelodyNote[][] }[];
	expected: ExpectedNote[];
	toleranceMs: number;
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

export function createExercise(prefs: SightReadingPrefs, seed: number): SightReadingExercise {
	const rng = createRng(seed);
	const level = SIGHT_READING_LEVELS[prefs.level];
	const meter = parseMeter(prefs.meter) ?? rng.pick(level.meters);
	const key = chooseKey(prefs, level.maxFifths, rng);
	const tempo = prefs.tempo > 0 ? prefs.tempo : level.tempo;
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
		accidentalRate: level.accidentalRate
	};
	const parts: SightReadingExercise['parts'] = [
		{ clef: melodyClef, measures: generateMelody(settings, rng) }
	];
	if (prefs.staff === 'grand') parts.push({ clef: 'bass', measures: bassLine(settings, rng) });

	const tick = msPerTick(tempo);
	const perMeasure = measureTicks(meter);
	const expected: ExpectedNote[] = [];
	const referenceIds = new Set<string>();
	parts.forEach((part, p) => {
		part.measures.forEach((measure, m) => {
			let position = m * perMeasure;
			measure.forEach((note, n) => {
				const id = noteId(p, m, n);
				if (note.pitch && !note.rest) {
					expected.push({ id, midi: toMidi(note.pitch), time: position * tick });
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
		toleranceMs: level.toleranceMs,
		referenceIds,
		durationMs: bars * perMeasure * tick
	};
}

export const noteId = (part: number, measure: number, index: number): string =>
	`p${part}m${measure}n${index}`;

export function exerciseScore(
	exercise: SightReadingExercise,
	options: { showReferences: boolean; outcomes?: readonly ScoredNote[] }
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
					style
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
