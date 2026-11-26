import { describe, expect, it } from 'vitest';
import { buildProfile } from '#lib/audio/voice/calibration.ts';
import { calibrationTake, NAME_VOWELS, RATE, speak } from '#lib/audio/voice/testSignals.ts';
import { createExercise, MIN_SPOKEN_TOLERANCE_MS, spokenTempo } from './exercise';
import { SIGHT_READING_DEFAULTS } from './prefs';
import { hearReading } from './hear';
import { scoreRun } from './spoken';

const LATENCY = 0.06;
const calibration = calibrationTake(LATENCY);
const result = buildProfile(calibration.prompts, calibration.syllables, 'solfege');
if (!result.ok) throw new Error('calibration failed');
const profile = result.profile;

const voice = { ...SIGHT_READING_DEFAULTS, input: 'voice', level: 1, bars: 4 } as const;
const exercise = createExercise(voice, 11);

interface Reading {
	/** Replaces the name said at one note. */
	misread?: { index: number; vowel: keyof typeof NAME_VOWELS };
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
		vowel: NAME_VOWELS[index === misread?.index ? misread.vowel : note.letter],
		at: onsetAt(lead, note.time),
		duration: legato ? ((expected[index + 1]?.time ?? end) - note.time) / 1000 + 0.02 : 0.15,
		f0: legato ? 440 * 2 ** ((note.midi - 81) / 12) : 140
	}));
	const samples = speak(lead + exercise.durationMs / 1000 + 0.5, syllables);
	if (legato) {
		// Each name's consonant: a slight dip, deeper where a name repeats and the vowel can't change.
		expected.forEach((note, index) => {
			const repeated = expected[index - 1]?.letter === note.letter;
			const start = Math.round((onsetAt(lead, note.time) - 0.025) * RATE);
			for (let n = Math.max(0, start); n < start + 0.025 * RATE; n++) {
				samples[n] *= repeated ? 0.3 : 0.7;
			}
		});
	}
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

	it('marks a misread name as wrong', () => {
		const index = 2;
		const actual = exercise.expected[index].letter;
		const other = actual === 'C' ? 'E' : 'C';
		const summary = scoreRun(exercise, {
			input: 'voice',
			notes: reading({ misread: { index, vowel: other } })
		});
		expect(summary.notes[index].outcome).toBe('wrong');
		expect(summary.notes.filter((note) => note.outcome === 'correct')).toHaveLength(
			exercise.expected.length - 1
		);
	});

	it('scores MIDI runs on exact pitch, as before', () => {
		const notes = exercise.expected.map(({ midi, time }) => ({ midi: midi + 12, time }));
		expect(scoreRun(exercise, { input: 'midi', notes }).pitchAccuracy).toBe(0);
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
