import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parseMidiMessage } from './midi.svelte';

describe('parseMidiMessage', () => {
	it.each([
		{ data: [0x90, 60, 100], expected: { midi: 60, velocity: 100, on: true, time: 5 } },
		{ data: [0x93, 61, 1], expected: { midi: 61, velocity: 1, on: true, time: 5 } },
		{ data: [0x80, 60, 64], expected: { midi: 60, velocity: 0, on: false, time: 5 } },
		{ data: [0x90, 60, 0], expected: { midi: 60, velocity: 0, on: false, time: 5 } }
	])('reads $data', ({ data, expected }) => {
		expect(parseMidiMessage(new Uint8Array(data), 5)).toEqual(expected);
	});

	it.each([[[0xb0, 64, 127]], [[0xe0, 0, 64]], [[0xf8]], [[]]])('ignores %j', (data) => {
		expect(parseMidiMessage(new Uint8Array(data), 0)).toBeNull();
	});
});

interface FakeInput {
	name: string;
	onmidimessage: ((message: { data: Uint8Array; timeStamp: number }) => void) | null;
}

function fakeAccess(names: string[]) {
	const inputs = new Map<string, FakeInput>(
		names.map((name) => [name, { name, onmidimessage: null }])
	);
	return { inputs, onstatechange: null as (() => void) | null };
}

const send = (input: FakeInput | undefined, data: number[], timeStamp = 0): void =>
	input?.onmidimessage?.({ data: new Uint8Array(data), timeStamp });

describe('midi input', () => {
	beforeEach(() => vi.resetModules());
	afterEach(() => vi.unstubAllGlobals());

	it('reports unsupported browsers', async () => {
		vi.stubGlobal('navigator', {});
		const { midi } = await import('./midi.svelte');
		await midi.connect();
		expect(midi.status).toBe('unsupported');
	});

	it('reports refused access', async () => {
		vi.stubGlobal('navigator', { requestMIDIAccess: () => Promise.reject(new Error('no')) });
		const { midi } = await import('./midi.svelte');
		await midi.connect();
		expect(midi.status).toBe('denied');
	});

	it('lists devices, tracks held keys and notifies listeners', async () => {
		const access = fakeAccess(['Stage 88']);
		vi.stubGlobal('navigator', { requestMIDIAccess: () => Promise.resolve(access) });
		const { midi } = await import('./midi.svelte');
		await midi.connect();
		expect(midi.status).toBe('ready');
		expect(midi.devices).toEqual(['Stage 88']);

		const heard: number[] = [];
		const stop = midi.onNote((event) => event.on && heard.push(event.midi));
		const input = access.inputs.get('Stage 88');
		send(input, [0x90, 64, 90]);
		send(input, [0x90, 67, 90]);
		expect([...midi.held]).toEqual([64, 67]);
		send(input, [0x80, 64, 0]);
		expect([...midi.held]).toEqual([67]);

		stop();
		send(input, [0x90, 72, 90]);
		expect(heard).toEqual([64, 67]);
	});

	it('rebinds when a device is plugged in', async () => {
		const access = fakeAccess(['A']);
		vi.stubGlobal('navigator', { requestMIDIAccess: () => Promise.resolve(access) });
		const { midi } = await import('./midi.svelte');
		await midi.connect();
		access.inputs.set('B', { name: 'B', onmidimessage: null });
		access.onstatechange?.();
		expect(midi.devices).toEqual(['A', 'B']);
		send(access.inputs.get('B'), [0x90, 50, 80]);
		expect(midi.held.has(50)).toBe(true);
	});

	it('requests access only once', async () => {
		const request = vi.fn(() => Promise.resolve(fakeAccess([])));
		vi.stubGlobal('navigator', { requestMIDIAccess: request });
		const { midi } = await import('./midi.svelte');
		await Promise.all([midi.connect(), midi.connect()]);
		await midi.connect();
		expect(request).toHaveBeenCalledTimes(1);
	});
});
