import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createExercise } from './exercise';
import PracticeRun from './PracticeRun.svelte';
import { SIGHT_READING_DEFAULTS } from './prefs';

let finishLoading = (): void => {};

vi.mock('#lib/audio/engine.ts', () => ({
	ensureAudio: vi.fn(() => new Promise<void>((resolve) => (finishLoading = resolve))),
	stopAll: vi.fn()
}));

const stopMetronome = vi.fn();
vi.mock('#lib/audio/metronome.ts', () => ({
	startMetronome: vi.fn(() => ({ startTime: 0, readingStartTime: 0, stop: stopMetronome }))
}));

const { startMetronome } = await import('#lib/audio/metronome.ts');

const props = () => ({
	exercise: createExercise(SIGHT_READING_DEFAULTS, 5),
	prefs: SIGHT_READING_DEFAULTS,
	onperform: vi.fn(),
	onnext: vi.fn(),
	onsetup: vi.fn()
});

beforeEach(() => {
	vi.mocked(startMetronome).mockClear();
	stopMetronome.mockClear();
});

describe('PracticeRun', () => {
	it('starts one metronome however often Start is clicked while the sound loads', async () => {
		const screen = await render(PracticeRun, props());
		const button = screen.getByRole('button', { name: 'Start metronome' });
		await button.click();
		const loading = screen.getByRole('button', { name: 'Loading sound…' });
		await expect.element(loading).toBeDisabled();
		// A click that gets through anyway (a double tap) must not start a second run.
		loading.element().dispatchEvent(new MouseEvent('click', { bubbles: true }));
		finishLoading();
		await expect.element(screen.getByRole('button', { name: 'Stop metronome' })).toBeVisible();
		expect(startMetronome).toHaveBeenCalledOnce();

		await screen.getByRole('button', { name: 'Stop metronome' }).click();
		expect(stopMetronome).toHaveBeenCalled();
	});

	it('never starts a metronome when left while the sound was still loading', async () => {
		const screen = await render(PracticeRun, props());
		await screen.getByRole('button', { name: 'Start metronome' }).click();
		await screen.unmount();
		finishLoading();
		await new Promise((resolve) => setTimeout(resolve, 20));
		expect(startMetronome).not.toHaveBeenCalled();
	});
});
