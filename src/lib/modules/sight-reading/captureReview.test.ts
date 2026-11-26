import { describe, expect, it } from 'vitest';
import { buildProfile } from '#lib/audio/voice/calibration.ts';
import {
	calibrationTake,
	NAME_SOUNDS,
	NONSENSE_SOUNDS,
	speak
} from '#lib/audio/voice/testSignals.ts';
import {
	captureFileName,
	captureId,
	encodeLabels,
	encodeReading,
	encodeSetup,
	fromBase64Pcm,
	type NoteLabel
} from './capture';
import { asWritten, emptyTally, replayCapture, tallyReading } from './captureReview';
import { createExercise } from './exercise';
import { hearReading } from './hear';
import { SIGHT_READING_DEFAULTS } from './prefs';

const LATENCY = 0.06;
const LEAD = 0.4;
const RATE = 48_000;
const calibration = calibrationTake(LATENCY);
const result = buildProfile(calibration.prompts, calibration.syllables, 'solfege');
if (!result.ok) throw new Error('calibration failed');
const profile = result.profile;
const exercise = createExercise(
	{ ...SIGHT_READING_DEFAULTS, input: 'voice', level: 1, bars: 4 },
	11
);

/** A reading where `nonsenseAt` is said as nonsense and `misreadAt` as another name. */
function record(nonsenseAt = -1, misreadAt = -1) {
	const samples = speak(
		LEAD + exercise.durationMs / 1000 + 0.5,
		exercise.expected.map((note, index) => ({
			...(index === nonsenseAt
				? NONSENSE_SOUNDS[0]
				: NAME_SOUNDS[index === misreadAt ? (note.letter === 'C' ? 'E' : 'C') : note.letter]),
			at: LEAD + note.time / 1000 + LATENCY,
			duration: 0.2
		})),
		RATE
	);
	const recording = { samples, sampleRate: RATE, startTime: 3 };
	const heard = hearReading(recording, 3 + LEAD, exercise, profile);
	return {
		recording,
		heard,
		capture: encodeReading('reading-test', recording, 3 + LEAD, exercise, profile, heard)
	};
}

describe('collected readings', () => {
	it('replays a saved reading to the same names and times', () => {
		const { heard, capture } = record();
		const replayed = replayCapture(JSON.parse(JSON.stringify(capture)) as typeof capture);
		expect(replayed.map((note) => note.letter)).toEqual(heard.map((note) => note.letter));
		replayed.forEach((note, i) => expect(Math.abs(note.time - heard[i].time)).toBeLessThan(15));
	});

	it('tallies what was said against what the app heard', () => {
		const nonsenseAt = 3;
		const misreadAt = 5;
		const { capture } = record(nonsenseAt, misreadAt);
		const labels: NoteLabel[] = asWritten(capture).map((label, index) =>
			index === nonsenseAt
				? { ...label, said: 'other' }
				: index === misreadAt
					? { ...label, said: label.expected === 'C' ? 'E' : 'C' }
					: label
		);
		const tally = tallyReading(emptyTally(), capture, labels);
		expect(tally.namesRight).toBe(exercise.expected.length - 1);
		expect(tally.namesWrong + tally.namesMissed).toBe(0);
		expect(tally.notNames).toBe(1);
		expect(tally.falseAsScore).toBe(0);
	});

	it('names files so labels sit next to their recording', () => {
		const id = captureId('reading', new Date('2026-11-26T10:20:30.400Z'));
		expect(id).toMatch(/^reading-2026-11-26T10-20-30-400Z-[a-z0-9]{1,4}$/);
		expect(captureFileName(id)).toBe(`dolfine-${id}.json`);
		expect(captureFileName(id, true)).toBe(`dolfine-${id}.labels.json`);
		expect(encodeLabels(id, []).captureId).toBe(id);
	});

	it('saves a set-up with its prompts as labels', () => {
		const samples = new Float32Array(RATE).map((_, i) => Math.sin(i / 10) * 0.5);
		const setup = encodeSetup(
			'setup-test',
			{ samples, sampleRate: RATE, startTime: 2 },
			2.5,
			1000,
			calibration.prompts,
			'solfege'
		);
		expect(setup.recordingStartMs).toBe(-500);
		expect(setup.prompts).toHaveLength(28);
		const decoded = fromBase64Pcm(setup.samples);
		expect(decoded.length).toBe(16_000);
		expect(Math.max(...decoded)).toBeCloseTo(0.5, 1);
	});
});
