import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { midi } from '#lib/midi/midi.svelte.ts';
import MidiStatus from './MidiStatus.svelte';

function fakeAccess(names: string[]): MIDIAccess {
	const inputs = new Map(names.map((name) => [name, { name, onmidimessage: null }]));
	return { inputs, onstatechange: null } as unknown as MIDIAccess;
}

beforeEach(() => {
	midi.status = 'idle';
	midi.devices = [];
});

afterEach(() => vi.restoreAllMocks());

const connect = async () => {
	const screen = await render(MidiStatus);
	await screen.getByRole('button', { name: 'Connect MIDI keyboard' }).click();
	return screen;
};

describe('MidiStatus', () => {
	it('connects and lists the keyboard', async () => {
		vi.spyOn(navigator, 'requestMIDIAccess').mockResolvedValue(fakeAccess(['Stage 88']));
		const screen = await connect();
		await expect.element(screen.getByText('MIDI ready · Stage 88')).toBeVisible();
	});

	it('says when no device is plugged in yet', async () => {
		vi.spyOn(navigator, 'requestMIDIAccess').mockResolvedValue(fakeAccess([]));
		const screen = await connect();
		await expect.element(screen.getByText(/no device detected yet/)).toBeVisible();
	});

	it('explains a refusal', async () => {
		vi.spyOn(navigator, 'requestMIDIAccess').mockRejectedValue(
			new DOMException('no', 'SecurityError')
		);
		const screen = await connect();
		await expect.element(screen.getByText(/MIDI access was refused/)).toBeVisible();
	});
});
