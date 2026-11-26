import type { Letter } from '#lib/music/pitch.ts';
import { describe, expect, it } from 'vitest';
import { buildProfile } from '#lib/audio/voice/calibration.ts';
import {
	calibrationTake,
	NAME_SOUNDS,
	NONSENSE_SOUNDS,
	RATE,
	speak
} from '#lib/audio/voice/testSignals.ts';
import { createExercise, MIN_SPOKEN_TOLERANCE_MS, spokenTempo } from './exercise';
import { SIGHT_READING_DEFAULTS } from './prefs';
import { encodeCapture, replayCapture } from './capture';
import { hearReading } from './hear';
import { heardLabels, scoreRun } from './spoken';

const LATENCY = 0.06;
const calibration = calibrationTake(LATENCY);
const result = buildProfile(calibration.prompts, calibration.syllables, 'solfege');
if (!result.ok) throw new Error('calibration failed');
const profile = result.profile;

const voice = { ...SIGHT_READING_DEFAULTS, input: 'voice', level: 1, bars: 4 } as const;
const exercise = createExercise(voice, 11);

interface Reading {
	/** Replaces the name said at one note. */
	misread?: { index: number; letter: Letter };
	/** Holds each name until the next and sings it at pitch, as a fluent reader does. */
	legato?: boolean;
}

const onsetAt = (lead: number, time: number): number => lead + time / 1000 + LATENCY;

/** The student reads the exercise aloud. */
function reading({ misread, legato = false }: Reading = {}) {
	const lead = 0.4;
	const { expected } = exercise;
	const end = exercise.durationMs;
	const syllables = expected.map((note, index) => ({
		...NAME_SOUNDS[index === misread?.index ? misread.letter : note.letter],
		at: onsetAt(lead, note.time),
		duration: legato ? ((expected[index + 1]?.time ?? end) - note.time) / 1000 - 0.05 : 0.15,
		f0: legato ? 440 * 2 ** ((note.midi - 81) / 12) : 140
	}));
	const samples = speak(lead + exercise.durationMs / 1000 + 0.5, syllables);
	const recordingStart = 10;
	return hearReading(
		{ samples, sampleRate: RATE, startTime: recordingStart },
		recordingStart + lead,
		exercise,
		profile
	);
}

describe('spoken reading', () => {
	it('grades a clean reading at 100% on names and rhythm', () => {
		const summary = scoreRun(exercise, { input: 'voice', notes: reading() });
		expect(summary.pitchAccuracy).toBe(100);
		expect(summary.rhythmAccuracy).toBe(100);
		expect(summary.extras).toHaveLength(0);
	});

	it('grades a fluent legato reading, sung at pitch, at 100%', () => {
		const summary = scoreRun(exercise, { input: 'voice', notes: reading({ legato: true }) });
		expect(summary.notes.filter((note) => note.outcome !== 'correct')).toEqual([]);
		expect(summary.extras).toHaveLength(0);
	});

	it('gives almost no right notes to nonsense said on time', () => {
		for (const f0 of [130, 200]) {
			const lead = 0.4;
			const samples = speak(
				lead + exercise.durationMs / 1000 + 0.5,
				exercise.expected.map((note, index) => ({
					...NONSENSE_SOUNDS[index % NONSENSE_SOUNDS.length],
					at: lead + note.time / 1000 + LATENCY,
					duration: 0.25,
					f0
				}))
			);
			const notes = hearReading(
				{ samples, sampleRate: RATE, startTime: 0 },
				lead,
				exercise,
				profile
			);
			expect(scoreRun(exercise, { input: 'voice', notes }).pitchAccuracy).toBeLessThanOrEqual(10);
		}
	});

	it('marks a misread name as wrong', () => {
		const index = 2;
		const actual = exercise.expected[index].letter;
		const other = actual === 'C' ? 'E' : 'C';
		const summary = scoreRun(exercise, {
			input: 'voice',
			notes: reading({ misread: { index, letter: other } })
		});
		expect(summary.notes[index].outcome).toBe('wrong');
		const performance = {
			input: 'voice',
			notes: reading({ misread: { index, letter: other } })
		} as const;
		const labels = heardLabels(
			scoreRun(exercise, performance).notes,
			performance,
			'solfege',
			false
		);
		expect([...labels]).toEqual([[summary.notes[index].id, other === 'C' ? 'Do' : 'Mi']]);
		expect(summary.notes.filter((note) => note.outcome === 'correct')).toHaveLength(
			exercise.expected.length - 1
		);
	});

	it('scores MIDI runs on exact pitch, as before, and labels a wrong key with its octave', () => {
		const notes = exercise.expected.map(({ midi, time }) => ({ midi: midi + 12, time }));
		const performance = { input: 'midi', notes } as const;
		const summary = scoreRun(exercise, performance);
		expect(summary.pitchAccuracy).toBe(0);
		const first = exercise.expected[0];
		expect(heardLabels(summary.notes, performance, 'letters', false).get(summary.notes[0].id)).toBe(
			`${first.letter}${Math.floor((first.midi + 12) / 12) - 1}`
		);
	});
});

describe('spoken exercises', () => {
	it('reads one staff, with a tolerance no tighter than spoken onsets allow', () => {
		const grand = createExercise({ ...voice, staff: 'grand', level: 10 }, 3);
		expect(grand.parts).toHaveLength(1);
		expect(grand.toleranceMs).toBe(MIN_SPOKEN_TOLERANCE_MS);
		expect(createExercise({ ...voice, input: 'midi', staff: 'grand' }, 3).parts).toHaveLength(2);
	});

	it('slows down only when names would come faster than five a second', () => {
		expect(spokenTempo(104, 3)).toBe(75);
		expect(spokenTempo(60, 6)).toBe(60);
		expect(spokenTempo(60, Infinity)).toBe(60);
		const fast = createExercise({ ...voice, level: 10, tempo: 200 }, 4);
		const gaps = fast.expected.slice(1).map((note, i) => note.time - fast.expected[i].time);
		expect(Math.min(...gaps)).toBeGreaterThanOrEqual(199);
		expect(fast.slowedFrom).toBe(200);
	});
});

describe('reading captures', () => {
	it('replays a saved run to the same names and times', () => {
		const lead = 0.4;
		const samples = speak(
			lead + exercise.durationMs / 1000 + 0.5,
			exercise.expected.map((note) => ({
				...NAME_SOUNDS[note.letter],
				at: lead + note.time / 1000 + LATENCY,
				duration: 0.2
			})),
			48_000
		);
		const recording = { samples, sampleRate: 48_000, startTime: 3 };
		const heard = hearReading(recording, 3 + lead, exercise, profile);
		const capture = encodeCapture(recording, 3 + lead, exercise, profile, heard);
		const replayed = replayCapture(capture);
		expect(replayed.map((note) => note.letter)).toEqual(heard.map((note) => note.letter));
		replayed.forEach((note, i) => expect(Math.abs(note.time - heard[i].time)).toBeLessThan(15));
	});
});
