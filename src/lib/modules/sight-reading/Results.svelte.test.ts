import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createExercise } from './exercise';
import { SIGHT_READING_DEFAULTS } from './prefs';
import Results from './Results.svelte';

const exercise = createExercise({ ...SIGHT_READING_DEFAULTS, bars: 2 }, 5);
const perfect = exercise.expected.map(({ midi, time }) => ({ midi, time }));

const handlers = () => ({
	onrestart: vi.fn(),
	onpractise: vi.fn(),
	onnext: vi.fn(),
	onlevelup: vi.fn(),
	onsetup: vi.fn()
});

const notation = (container: HTMLElement) => container.querySelector('figure.score');

describe('Results', () => {
	it('scores a clean run and suggests moving on', async () => {
		const screen = await render(Results, {
			exercise,
			played: perfect,
			scored: true,
			canLevelUp: true,
			...handlers()
		});
		await expect.element(screen.getByText('100%').first()).toBeVisible();
		await expect.element(screen.getByText(/Clean and steady/)).toBeVisible();
		await expect.element(screen.getByText(`● correct ${perfect.length}`)).toBeVisible();
		await expect
			.element(screen.getByRole('figure', { name: 'Exercise with results' }))
			.toBeVisible();
	});

	it('keeps the staff on screen after an unscored run', async () => {
		const screen = await render(Results, {
			exercise,
			played: [],
			scored: false,
			canLevelUp: false,
			...handlers()
		});
		await expect.element(screen.getByText(/this run was not scored/)).toBeVisible();
		await expect
			.element(screen.getByRole('figure', { name: 'Exercise with results' }))
			.toBeVisible();
		await expect.element(screen.getByRole('button', { name: 'Level up' })).not.toBeInTheDocument();
		expect(notation(screen.container)).not.toBeNull();
	});

	it('does not score a stopped run, even with MIDI', async () => {
		const screen = await render(Results, {
			exercise,
			played: perfect,
			scored: true,
			stopped: true,
			canLevelUp: true,
			...handlers()
		});
		await expect.element(screen.getByText(/^Stopped\./)).toBeVisible();
		await expect.element(screen.getByText('pitch accuracy')).not.toBeInTheDocument();
		await expect
			.element(screen.getByRole('figure', { name: 'Exercise with results' }))
			.toBeVisible();
	});

	it('restarts or switches to practice on the same exercise', async () => {
		const actions = handlers();
		const screen = await render(Results, {
			exercise,
			played: [],
			scored: false,
			canLevelUp: true,
			...actions
		});
		await screen.getByRole('button', { name: 'Restart from the beginning' }).click();
		await screen.getByRole('button', { name: 'Practise this exercise' }).click();
		expect(actions.onrestart).toHaveBeenCalledOnce();
		expect(actions.onpractise).toHaveBeenCalledOnce();
		expect(actions.onnext).not.toHaveBeenCalled();
	});
});
