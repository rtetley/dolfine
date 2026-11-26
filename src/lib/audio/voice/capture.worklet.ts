// Runs on the audio thread. The AudioWorklet globals are not in the DOM typings.
declare const currentFrame: number;
declare function registerProcessor(name: string, processor: typeof AudioWorkletProcessor): void;
declare class AudioWorkletProcessor {
	readonly port: MessagePort;
}

const BATCH = 2048;

class CaptureProcessor extends AudioWorkletProcessor {
	private buffer = new Float32Array(BATCH);
	private filled = 0;
	private firstFrame = 0;

	process(inputs: Float32Array[][]): boolean {
		const channel = inputs[0]?.[0];
		if (!channel) return true;
		if (this.filled === 0) this.firstFrame = currentFrame;
		this.buffer.set(channel, this.filled);
		this.filled += channel.length;
		if (this.filled + channel.length > BATCH) {
			this.port.postMessage({ frame: this.firstFrame, samples: this.buffer.slice(0, this.filled) });
			this.filled = 0;
		}
		return true;
	}
}

registerProcessor('dolfine-capture', CaptureProcessor);
