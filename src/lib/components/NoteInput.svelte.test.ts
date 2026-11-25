import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SvelteSet } from 'svelte/reactivity';
import { render } from 'vitest-browser-svelte';
import NoteInput from './NoteInput.svelte';

vi.mock('#lib/audio/engine.ts', () => ({
	ensureAudio: vi.fn(() => Promise.resolve()),
	playNotes: vi.fn()
}));

const { playNotes } = await import('#lib/audio/engine.ts');

beforeEach(() => vi.mocked(playNotes).mockClear());

describe('NoteInput', () => {
	it('toggles notes, sounds each new one and counts them', async () => {
		const selected = new SvelteSet<number>();
		const screen = await render(NoteInput, { selected, low: 60, high: 72 });
		await screen.getByRole('button', { name: 'C4' }).click();
		await screen.getByRole('button', { name: 'E4' }).click();
		await expect.element(screen.getByText('2 notes selected')).toBeVisible();
		expect([...selected]).toEqual([60, 64]);
		await vi.waitFor(() => expect(playNotes).toHaveBeenCalledWith([64], 0.8));

		await screen.getByRole('button', { name: 'C4' }).click();
		await expect.element(screen.getByText('1 note selected')).toBeVisible();
	});

	it('stops at the note limit', async () => {
		const selected = new SvelteSet<number>();
		const screen = await render(NoteInput, { selected, low: 60, high: 72, maxNotes: 2 });
		for (const name of ['C4', 'D4', 'E4']) await screen.getByRole('button', { name }).click();
		expect([...selected]).toEqual([60, 62]);
	});

	it('clears and plays back the chord in pitch order', async () => {
		const selected = new SvelteSet([67, 60]);
		const screen = await render(NoteInput, { selected, low: 60, high: 72 });
		await screen.getByRole('button', { name: 'Hear it' }).click();
		await vi.waitFor(() => expect(playNotes).toHaveBeenCalledWith([60, 67]));
		await screen.getByRole('button', { name: 'Clear' }).click();
		await expect.element(screen.getByText('0 notes selected')).toBeVisible();
		await expect.element(screen.getByRole('button', { name: 'Clear' })).toBeDisabled();
	});
});
