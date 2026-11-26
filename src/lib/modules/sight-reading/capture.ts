import type { Recording } from '#lib/audio/voice/microphone.ts';
import type { VoiceProfile } from '#lib/audio/voice/profile.ts';
import { ANALYSIS_RATE, resample } from '#lib/audio/voice/signal.ts';
import type { SightReadingExercise } from './exercise';
import { hearReading } from './hear';
import type { SpokenNote } from './spoken';

/**
 * A spoken run saved for tuning recognition on real voices: the audio at the analysis rate, the
 * exercise's timing and the student's set-up, enough to replay `hearReading` offline.
 * Only downloaded when the page is opened with `?debug`; nothing is sent anywhere.
 */
export interface ReadingCapture {
	format: 'dolfine-reading-capture';
	version: 1;
	sampleRate: number;
	/** Recording start relative to the first beat after the count-in. */
	recordingStartMs: number;
	expected: SightReadingExercise['expected'];
	toleranceMs: number;
	tempo: number;
	profile: VoiceProfile;
	heard: SpokenNote[];
	/** 16-bit little-endian PCM, base64. */
	samples: string;
}

function toBase64Pcm(samples: Float32Array): string {
	const bytes = new Uint8Array(samples.length * 2);
	const view = new DataView(bytes.buffer);
	samples.forEach((sample, i) =>
		view.setInt16(i * 2, Math.round(Math.max(-1, Math.min(1, sample)) * 32767), true)
	);
	let binary = '';
	for (let i = 0; i < bytes.length; i += 0x8000) {
		binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
	}
	return btoa(binary);
}

export const fromBase64Pcm = (encoded: string): Float32Array => {
	const binary = atob(encoded);
	const view = new DataView(Uint8Array.from(binary, (char) => char.charCodeAt(0)).buffer);
	return Float32Array.from(
		{ length: binary.length / 2 },
		(_, i) => view.getInt16(i * 2, true) / 32767
	);
};

export const encodeCapture = (
	recording: Recording,
	readingStart: number,
	exercise: Pick<SightReadingExercise, 'expected' | 'toleranceMs' | 'tempo'>,
	profile: VoiceProfile,
	heard: SpokenNote[]
): ReadingCapture => ({
	format: 'dolfine-reading-capture',
	version: 1,
	sampleRate: ANALYSIS_RATE,
	recordingStartMs: (recording.startTime - readingStart) * 1000,
	expected: exercise.expected,
	toleranceMs: exercise.toleranceMs,
	tempo: exercise.tempo,
	profile,
	heard,
	samples: toBase64Pcm(resample(recording.samples, recording.sampleRate))
});

export function downloadCapture(capture: ReadingCapture): void {
	const blob = new Blob([JSON.stringify(capture)], { type: 'application/json' });
	const link = document.createElement('a');
	link.href = URL.createObjectURL(blob);
	link.download = `dolfine-reading-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
	link.click();
	setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

/** Listens to a saved run again with the current recognition. */
export const replayCapture = (capture: ReadingCapture): SpokenNote[] =>
	hearReading(
		{
			samples: fromBase64Pcm(capture.samples),
			sampleRate: capture.sampleRate,
			startTime: capture.recordingStartMs / 1000
		},
		0,
		capture,
		capture.profile
	);
