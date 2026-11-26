import captureUrl from './capture.worklet.ts?worker&url';

export interface Recording {
	samples: Float32Array;
	sampleRate: number;
	/** AudioContext time of the first sample, on the same clock the metronome is scheduled on. */
	startTime: number;
}

export interface Recorder {
	stop(): Recording;
}

export interface Microphone {
	record(): Recorder;
	close(): void;
}

export type MicrophoneError = 'denied' | 'unavailable';

export const microphoneError = (error: unknown): MicrophoneError =>
	error instanceof DOMException &&
	(error.name === 'NotAllowedError' || error.name === 'SecurityError')
		? 'denied'
		: 'unavailable';

const loaded = new WeakMap<AudioContext, Promise<void>>();

function loadWorklet(context: AudioContext): Promise<void> {
	let loading = loaded.get(context);
	if (!loading) {
		loading = context.audioWorklet.addModule(captureUrl);
		loaded.set(context, loading);
	}
	return loading;
}

interface Chunk {
	frame: number;
	samples: Float32Array;
}

function join(chunks: readonly Chunk[], sampleRate: number): Recording {
	const length = chunks.reduce((sum, chunk) => sum + chunk.samples.length, 0);
	const samples = new Float32Array(length);
	let offset = 0;
	for (const chunk of chunks) {
		samples.set(chunk.samples, offset);
		offset += chunk.samples.length;
	}
	return { samples, sampleRate, startTime: (chunks[0]?.frame ?? 0) / sampleRate };
}

/**
 * Opens the microphone on the app's AudioContext. Echo cancellation keeps the metronome out of
 * the recording; noise suppression and gain control stay off, since they reshape syllable onsets.
 */
export async function openMicrophone(context: AudioContext): Promise<Microphone> {
	if (!navigator.mediaDevices?.getUserMedia) throw new DOMException('', 'NotFoundError');
	const stream = await navigator.mediaDevices.getUserMedia({
		audio: { echoCancellation: true, noiseSuppression: false, autoGainControl: false }
	});
	await loadWorklet(context);
	const source = context.createMediaStreamSource(stream);
	const silent = context.createGain();
	silent.gain.value = 0;
	silent.connect(context.destination);

	return {
		record: () => {
			const chunks: Chunk[] = [];
			const node = new AudioWorkletNode(context, 'dolfine-capture', { numberOfOutputs: 1 });
			node.port.onmessage = (event: MessageEvent<Chunk>) => chunks.push(event.data);
			source.connect(node);
			node.connect(silent);
			return {
				stop: () => {
					source.disconnect(node);
					node.disconnect();
					node.port.onmessage = null;
					return join(chunks, context.sampleRate);
				}
			};
		},
		close: () => {
			source.disconnect();
			silent.disconnect();
			stream.getTracks().forEach((track) => track.stop());
		}
	};
}
