import { SvelteSet } from 'svelte/reactivity';

export type MidiStatus = 'idle' | 'unsupported' | 'requesting' | 'denied' | 'ready';

export interface MidiNoteEvent {
	midi: number;
	velocity: number;
	on: boolean;
	time: number;
}

type Listener = (event: MidiNoteEvent) => void;

export function parseMidiMessage(data: Uint8Array, time: number): MidiNoteEvent | null {
	const [status = 0, note = 0, velocity = 0] = data;
	const command = status & 0xf0;
	if (command === 0x90 && velocity > 0) return { midi: note, velocity, on: true, time };
	if (command === 0x80 || (command === 0x90 && velocity === 0))
		return { midi: note, velocity: 0, on: false, time };
	return null;
}

export const isMidiSupported = (): boolean =>
	typeof navigator !== 'undefined' && typeof navigator.requestMIDIAccess === 'function';

class MidiInput {
	status = $state<MidiStatus>('idle');
	devices = $state<string[]>([]);
	held = new SvelteSet<number>();
	#listeners = new Set<Listener>();
	#access: MIDIAccess | null = null;

	async connect(): Promise<void> {
		if (!isMidiSupported()) {
			this.status = 'unsupported';
			return;
		}
		if (this.status === 'ready' || this.status === 'requesting') return;
		this.status = 'requesting';
		try {
			this.#access = await navigator.requestMIDIAccess();
			this.#bindInputs();
			this.#access.onstatechange = () => this.#bindInputs();
			this.status = 'ready';
		} catch {
			this.status = 'denied';
		}
	}

	onNote(listener: Listener): () => void {
		this.#listeners.add(listener);
		return () => this.#listeners.delete(listener);
	}

	#bindInputs(): void {
		if (!this.#access) return;
		const names: string[] = [];
		this.#access.inputs.forEach((input) => {
			names.push(input.name ?? 'MIDI input');
			input.onmidimessage = (message) => this.#handle(message);
		});
		this.devices = names;
	}

	#handle(message: MIDIMessageEvent): void {
		if (!message.data) return;
		const event = parseMidiMessage(message.data, message.timeStamp);
		if (!event) return;
		if (event.on) this.held.add(event.midi);
		else this.held.delete(event.midi);
		this.#listeners.forEach((listener) => listener(event));
	}
}

export const midi = new MidiInput();
