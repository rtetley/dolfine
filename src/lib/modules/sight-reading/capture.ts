import type { CalibrationPrompt } from '#lib/audio/voice/calibration.ts';
import type { Recording } from '#lib/audio/voice/microphone.ts';
import type { VoiceProfile } from '#lib/audio/voice/profile.ts';
import { ANALYSIS_RATE, resample } from '#lib/audio/voice/signal.ts';
import type { Letter, NoteNameSystem } from '#lib/music/pitch.ts';
import type { SightReadingExercise } from './exercise';
import type { NoteOutcome, ScoredNote } from '#lib/music/scoring.ts';
import type { SpokenNote } from './spoken';

/**
 * Recordings saved in collection mode, to tune recognition on real voices and later train a model:
 * the audio at the analysis rate plus what is needed to replay and label it. Files go to this
 * computer's downloads; nothing is sent anywhere.
 */

interface Audio {
	sampleRate: number;
	/** 16-bit little-endian PCM, base64. */
	samples: string;
}

/** A spoken reading, enough to replay `hearReading` on it offline. */
export interface ReadingCapture extends Audio {
	format: 'dolfine-reading-capture';
	version: 2;
	id: string;
	names: NoteNameSystem;
	/** Recording start relative to the first beat after the count-in. */
	recordingStartMs: number;
	expected: SightReadingExercise['expected'];
	toleranceMs: number;
	tempo: number;
	profile: VoiceProfile;
	heard: SpokenNote[];
}

/** A microphone set-up: labelled as recorded, since each click asked for one name or decoy. */
export interface SetupCapture extends Audio {
	format: 'dolfine-setup-capture';
	version: 1;
	id: string;
	names: NoteNameSystem;
	/** Recording start relative to the first prompt's click. */
	recordingStartMs: number;
	beatMs: number;
	prompts: CalibrationPrompt[];
}

/** What the reader says was actually said at a note: a name, nothing, or something else. */
export type Said = Letter | 'nothing' | 'other';

export interface NoteLabel {
	noteId: string;
	expected: Letter;
	said: Said;
}

export interface ReadingLabels {
	format: 'dolfine-reading-labels';
	version: 1;
	/** The `ReadingCapture` these labels belong to. */
	captureId: string;
	labels: NoteLabel[];
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

const audio = (recording: Recording): Audio => ({
	sampleRate: ANALYSIS_RATE,
	samples: toBase64Pcm(resample(recording.samples, recording.sampleRate))
});

/** Sorts by time in a downloads folder, and never repeats within a session. */
export const captureId = (kind: 'reading' | 'setup', now = new Date()): string =>
	`${kind}-${now.toISOString().replace(/[:.]/g, '-')}-${Math.random().toString(36).slice(2, 6)}`;

export const encodeReading = (
	id: string,
	recording: Recording,
	readingStart: number,
	exercise: Pick<SightReadingExercise, 'expected' | 'toleranceMs' | 'tempo'>,
	profile: VoiceProfile,
	heard: SpokenNote[]
): ReadingCapture => ({
	format: 'dolfine-reading-capture',
	version: 2,
	id,
	names: profile.names,
	recordingStartMs: (recording.startTime - readingStart) * 1000,
	expected: exercise.expected,
	toleranceMs: exercise.toleranceMs,
	tempo: exercise.tempo,
	profile,
	heard,
	...audio(recording)
});

export const encodeSetup = (
	id: string,
	recording: Recording,
	firstClick: number,
	beatMs: number,
	prompts: CalibrationPrompt[],
	names: NoteNameSystem
): SetupCapture => ({
	format: 'dolfine-setup-capture',
	version: 1,
	id,
	names,
	recordingStartMs: (recording.startTime - firstClick) * 1000,
	beatMs,
	prompts,
	...audio(recording)
});

export const encodeLabels = (captureId: string, labels: NoteLabel[]): ReadingLabels => ({
	format: 'dolfine-reading-labels',
	version: 1,
	captureId,
	labels
});

export const captureFileName = (id: string, labels = false): string =>
	`dolfine-${id}${labels ? '.labels' : ''}.json`;

export function download(fileName: string, data: unknown): void {
	const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
	const link = document.createElement('a');
	link.href = URL.createObjectURL(blob);
	link.download = fileName;
	link.click();
	setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

/** What the app heard at one note: the name it matched there, or nothing. */
export function heardAt(
	note: ScoredNote,
	expected: Letter,
	notes: readonly SpokenNote[]
): Letter | 'nothing' {
	const named: readonly NoteOutcome[] = ['correct', 'early', 'late'];
	if (named.includes(note.outcome)) return expected;
	if (note.outcome === 'wrong' && note.heard !== undefined) return notes[note.heard].letter;
	return 'nothing';
}
