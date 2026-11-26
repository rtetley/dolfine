import { describe, expect, it } from 'vitest';
import { buildProfile } from '#lib/audio/voice/calibration.ts';
import { calibrationTake, NAME_VOWELS, RATE, speak } from '#lib/audio/voice/testSignals.ts';
import { createExercise, MIN_SPOKEN_TOLERANCE_MS, spokenTempo } from './exercise';
import { SIGHT_READING_DEFAULTS } from './prefs';
import { hearReading, scoreRun } from './spoken';

const LATENCY = 0.06;
const calibration = calibrationTake(LATENCY);
const result = buildProfile(calibration.prompts, calibration.syllables, 'solfege');
if (!result.ok) throw new Error('calibration failed');
const profile = result.profile;

const voice = { ...SIGHT_READING_DEFAULTS, input: 'voice', level: 1, bars: 4 } as const;
const exercise = createExercise(voice, 11);

/** The student reads the exercise aloud; `misread` replaces the name at that note. */
function reading(misread?: { index: number; vowel: keyof typeof NAME_VOWELS }) {
	const lead = 0.4;
	const syllables = exercise.expected.map((note, index) => ({
		vowel: NAME_VOWELS[index === misread?.index ? misread.vowel : note.letter],
		at: lead + note.time / 1000 + LATENCY,
		duration: 0.15
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

	it('marks a misread name as wrong', () => {
		const index = 2;
		const actual = exercise.expected[index].letter;
		const other = actual === 'C' ? 'E' : 'C';
		const summary = scoreRun(exercise, {
			input: 'voice',
			notes: reading({ index, vowel: other })
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
